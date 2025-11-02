// src/app/admin/(protected)/events/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { hasPermission } from '@/app/admin/(protected)/roles/actions'
import { generateSlug, generateUniqueSlug, isValidSlug } from '@/lib/slug'
import type {
  Event,
  EventWithDetails,
  CreateEventInput,
  UpdateEventInput,
  EventFilters,
  EventStats,
  TicketType,
  CreateTicketTypeInput,
  UpdateTicketTypeInput,
} from '@/types/events.types'

// ============================================
// PERMISSION CHECKS
// ============================================

async function checkEventPermission(action: 'view' | 'create' | 'update' | 'delete'): Promise<boolean> {
  return await hasPermission(`events.${action}`)
}

// ============================================
// GET EVENTS
// ============================================

export async function getAllEvents(filters?: EventFilters) {
  const canView = await checkEventPermission('view')
  if (!canView) {
    throw new Error('Unauthorized: No permission to view events')
  }

  const supabase = await createClient()
  let query = supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*),
      ticket_types(*)
    `)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    } else {
      query = query.eq('status', filters.status)
    }
  }

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }

  if (filters?.is_featured !== undefined) {
    query = query.eq('is_featured', filters.is_featured)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  if (filters?.start_date_from) {
    query = query.gte('start_date', filters.start_date_from)
  }

  if (filters?.start_date_to) {
    query = query.lte('start_date', filters.start_date_to)
  }

  const { data, error } = await query

  if (error) throw error
  return data as EventWithDetails[]
}

export async function getEventById(id: string) {
  const canView = await checkEventPermission('view')
  if (!canView) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  
  console.log('[getEventById] Fetching event:', id)
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*),
      ticket_types(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getEventById] Error:', error)
    throw error
  }
  
  if (!data) {
    console.error('[getEventById] Event not found:', id)
    throw new Error('Event not found')
  }
  
  console.log('[getEventById] Success:', data.title)
  return data as EventWithDetails
}

export async function getEventBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*),
      ticket_types(*)
    `)
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data as EventWithDetails
}

// ============================================
// CREATE EVENT
// ============================================

export async function createEvent(input: CreateEventInput) {
  const canCreate = await checkEventPermission('create')
  if (!canCreate) {
    throw new Error('Unauthorized: No permission to create events')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Validate slug
  if (!isValidSlug(input.slug)) {
    throw new Error('Invalid slug format')
  }

  // Check if slug exists
  const { data: existing } = await supabase
    .from('events')
    .select('slug')
    .eq('slug', input.slug)
    .single()

  if (existing) {
    throw new Error('Slug already exists')
  }

  // Extract ticket types
  const { ticket_types, ...eventData } = input

  try {
    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        ...eventData,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (eventError) {
      console.error('Event creation error:', eventError)
      throw eventError
    }

    // Create ticket types
    if (ticket_types && ticket_types.length > 0) {
      const ticketTypesData = ticket_types.map((tt, index) => ({
        event_id: event.id,
        ...tt,
        sort_order: tt.sort_order ?? index,
      }))

      const { error: ticketError } = await supabase
        .from('ticket_types')
        .insert(ticketTypesData)

      if (ticketError) {
        console.error('Ticket types creation error:', ticketError)
        // Rollback: delete event if ticket types fail
        await supabase.from('events').delete().eq('id', event.id)
        throw ticketError
      }
    }

    revalidatePath('/admin/events')
    return event
  } catch (error) {
    console.error('Create event error:', error)
    throw error
  }
}

// ============================================
// UPDATE EVENT
// ============================================

export async function updateEvent(input: UpdateEventInput) {
  const canUpdate = await checkEventPermission('update')
  if (!canUpdate) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { id, ticket_types, ...eventData } = input

  // If slug is being updated, validate it
  if (eventData.slug) {
    if (!isValidSlug(eventData.slug)) {
      throw new Error('Invalid slug format')
    }

    // Check if slug exists (excluding current event)
    const { data: existing } = await supabase
      .from('events')
      .select('slug')
      .eq('slug', eventData.slug)
      .neq('id', id)
      .single()

    if (existing) {
      throw new Error('Slug already exists')
    }
  }

  // Update event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .update({
      ...eventData,
      updated_by: user.id,
    })
    .eq('id', id)
    .select()
    .single()

  if (eventError) throw eventError

  // Update ticket types if provided
  if (ticket_types) {
    // Delete existing ticket types
    await supabase.from('ticket_types').delete().eq('event_id', id)

    // Insert new ticket types
    if (ticket_types.length > 0) {
      const ticketTypesData = ticket_types.map((tt: any, index: number) => ({
        event_id: id,
        ...tt,
        sort_order: tt.sort_order ?? index,
      }))

      const { error: ticketError } = await supabase
        .from('ticket_types')
        .insert(ticketTypesData)

      if (ticketError) throw ticketError
    }
  }

  revalidatePath('/admin/events')
  revalidatePath(`/admin/events/${id}`)
  revalidatePath(`/events/${event.slug}`)
  return event
}

// ============================================
// DELETE EVENT
// ============================================

export async function deleteEvent(id: string) {
  const canDelete = await checkEventPermission('delete')
  if (!canDelete) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  // Check if event has orders (prevent deletion)
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)

  if (count && count > 0) {
    throw new Error('Cannot delete event with existing orders')
  }

  // Delete event (cascade will delete ticket types)
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/admin/events')
  return { success: true }
}

// ============================================
// CHANGE EVENT STATUS
// ============================================

export async function changeEventStatus(
  id: string,
  status: 'draft' | 'published' | 'cancelled' | 'completed'
) {
  const canUpdate = await checkEventPermission('update')
  if (!canUpdate) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('events')
    .update({
      status,
      updated_by: user.id,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/admin/events')
  revalidatePath(`/admin/events/${id}`)
  return data
}

// ============================================
// TOGGLE FEATURED
// ============================================

export async function toggleEventFeatured(id: string, isFeatured: boolean) {
  const canUpdate = await checkEventPermission('update')
  if (!canUpdate) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .update({ is_featured: isFeatured })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/admin/events')
  return data
}

// ============================================
// GET EVENT STATS
// ============================================

export async function getEventStats(): Promise<EventStats> {
  const canView = await checkEventPermission('view')
  if (!canView) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  const [
    { count: total },
    { count: published },
    { count: draft },
    { count: completed },
    { count: cancelled },
    { count: upcoming },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('start_date', new Date().toISOString()),
  ])

  // Get revenue and tickets sold (from orders table - will implement later)
  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('payment_status', 'paid')

  const total_revenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0

  const { count: tickets_sold } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })

  return {
    total_events: total || 0,
    published_events: published || 0,
    draft_events: draft || 0,
    completed_events: completed || 0,
    cancelled_events: cancelled || 0,
    total_tickets_sold: tickets_sold || 0,
    total_revenue,
    upcoming_events: upcoming || 0,
  }
}

// ============================================
// GENERATE SLUG FROM TITLE
// ============================================

export async function generateEventSlug(title: string): Promise<string> {
  const supabase = await createClient()
  
  const baseSlug = generateSlug(title)

  // Get all existing slugs
  const { data: events } = await supabase
    .from('events')
    .select('slug')

  const existingSlugs = events?.map(e => e.slug) || []

  // Generate unique slug
  return generateUniqueSlug(baseSlug, existingSlugs)
}

// ============================================
// GET EVENT CATEGORIES
// ============================================

export async function getEventCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw error
  return data
}

// ============================================
// DUPLICATE EVENT
// ============================================

export async function duplicateEvent(id: string) {
  const canCreate = await checkEventPermission('create')
  if (!canCreate) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Get original event
  const { data: original, error: fetchError } = await supabase
    .from('events')
    .select(`
      *,
      ticket_types(*)
    `)
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  // Generate new slug
  const newSlug = await generateEventSlug(`${original.title} Copy`)

  // Create new event
  const { ticket_types, id: _, created_at, updated_at, created_by, updated_by, ...eventData } = original

  const { data: newEvent, error: createError } = await supabase
    .from('events')
    .insert({
      ...eventData,
      slug: newSlug,
      title: `${original.title} (Copy)`,
      status: 'draft',
      current_attendees: 0,
      views_count: 0,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single()

  if (createError) throw createError

  // Duplicate ticket types
  if (ticket_types && ticket_types.length > 0) {
    const newTicketTypes = ticket_types.map(({ id, created_at, updated_at, sold_count, ...tt }: any) => ({
      ...tt,
      event_id: newEvent.id,
      sold_count: 0,
    }))

    const { error: ticketError } = await supabase
      .from('ticket_types')
      .insert(newTicketTypes)

    if (ticketError) throw ticketError
  }

  revalidatePath('/admin/events')
  return newEvent
}