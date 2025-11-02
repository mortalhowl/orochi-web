// src/app/(public)/events/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import type { EventFilters, EventSortOption, EventWithDetails } from '@/types/events.types'

// ============================================
// GET PUBLIC EVENTS (PUBLISHED ONLY)
// ============================================

export async function getPublicEvents(
  filters?: EventFilters,
  sort: EventSortOption = 'upcoming',
  page: number = 1,
  limit: number = 12
) {
  const supabase = await createClient()
  
  let query = supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*),
      ticket_types(*)
    `, { count: 'exact' })
    .eq('status', 'published')

  // Apply filters
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
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

  // Apply sorting
  switch (sort) {
    case 'upcoming':
      query = query
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'popular':
      query = query.order('views_count', { ascending: false })
      break
    default:
      query = query.order('start_date', { ascending: true })
  }

  // Pagination
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    events: data as EventWithDetails[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

// ============================================
// GET PUBLIC EVENT BY SLUG
// ============================================

export async function getPublicEventBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*),
      ticket_types(*)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) throw error

  // Increment views count
  await supabase
    .from('events')
    .update({ views_count: (data.views_count || 0) + 1 })
    .eq('id', data.id)

  return data as EventWithDetails
}

// ============================================
// GET FEATURED EVENTS
// ============================================

export async function getFeaturedEvents(limit: number = 6) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*),
      ticket_types(*)
    `)
    .eq('status', 'published')
    .eq('is_featured', true)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit)

  if (error) throw error

  return data as EventWithDetails[]
}

// ============================================
// GET RELATED EVENTS
// ============================================

export async function getRelatedEvents(eventId: string, categoryId?: string, limit: number = 4) {
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*),
      ticket_types(*)
    `)
    .eq('status', 'published')
    .neq('id', eventId)
    .gte('start_date', new Date().toISOString())

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query
    .order('start_date', { ascending: true })
    .limit(limit)

  if (error) throw error

  return data as EventWithDetails[]
}

// ============================================
// GET UPCOMING EVENTS
// ============================================

export async function getUpcomingEvents(limit: number = 6) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*),
      ticket_types(*)
    `)
    .eq('status', 'published')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit)

  if (error) throw error

  return data as EventWithDetails[]
}

// ============================================
// GET EVENT CATEGORIES (PUBLIC)
// ============================================

export async function getPublicCategories() {
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
// SEARCH EVENTS
// ============================================

export async function searchEvents(query: string, limit: number = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      slug,
      title,
      description,
      featured_image,
      start_date,
      category:event_categories(name, icon, color)
    `)
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit)

  if (error) throw error
  return data
}