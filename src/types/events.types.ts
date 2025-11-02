// src/types/events.types.ts

// ============================================
// EVENT STATUS & ENUMS
// ============================================

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

// ============================================
// EVENT CATEGORY
// ============================================

export type EventCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// TICKET TYPE
// ============================================

export type TicketType = {
  id: string
  event_id: string
  name: string
  description: string | null
  price: number
  quantity: number
  sold_count: number
  sale_start: string | null
  sale_end: string | null
  benefits: string[] // JSONB array
  points_earned: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// EVENT
// ============================================

export type Event = {
  id: string
  slug: string
  title: string
  description: string | null
  content: string | null // TipTap JSON string
  
  // Media
  featured_image: string | null
  banner_image: string | null
  gallery: string[] // JSONB array of Cloudinary URLs
  
  // Category
  category_id: string | undefined
  
  // Location
  location_name: string | null
  location_address: string | null
  location_map_url: string | null // Google Maps embed URL
  location_lat: number | null
  location_lng: number | null
  
  // Dates
  start_date: string
  end_date: string
  registration_start: string | null
  registration_end: string | null
  
  // Capacity
  max_attendees: number | null
  current_attendees: number
  
  // Status
  status: EventStatus
  is_featured: boolean
  
  // SEO
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
  
  // Stats
  views_count: number
  
  // Audit
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export type EventWithCategory = Event & {
  category: EventCategory | null
}

export type EventWithTickets = Event & {
  ticket_types: TicketType[]
}

export type EventWithDetails = Event & {
  category: EventCategory | null
  ticket_types: TicketType[]
  creator?: {
    id: string
    full_name: string | null
    email: string
  }
}

// ============================================
// FORM INPUT TYPES
// ============================================

export type CreateEventInput = {
  title: string
  slug: string
  description?: string
  content?: string // TipTap JSON string
  
  // Media
  featured_image?: string
  banner_image?: string
  gallery?: string[]
  
  // Category
  category_id?: string
  
  // Location
  location_name?: string
  location_address?: string
  location_map_url?: string
  location_lat?: number
  location_lng?: number
  
  // Dates
  start_date: string
  end_date: string
  registration_start?: string
  registration_end?: string
  
  // Capacity
  max_attendees?: number
  
  // Status
  status?: EventStatus
  is_featured?: boolean
  
  // SEO
  meta_title?: string
  meta_description?: string
  og_image?: string
  
  // Ticket types
  ticket_types: CreateTicketTypeInput[]
}

export type UpdateEventInput = Partial<CreateEventInput> & {
  id: string
}

export type CreateTicketTypeInput = {
  name: string
  description?: string
  price: number
  quantity: number
  sale_start?: string
  sale_end?: string
  benefits?: string[]
  points_earned?: number
  sort_order?: number
  is_active?: boolean
}

export type UpdateTicketTypeInput = Partial<CreateTicketTypeInput> & {
  id: string
}

// ============================================
// FILTER & QUERY TYPES
// ============================================

export type EventFilters = {
  status?: EventStatus | EventStatus[]
  category_id?: string
  is_featured?: boolean
  search?: string // Search in title, description
  start_date_from?: string
  start_date_to?: string
  min_price?: number
  max_price?: number
}

export type EventSortOption = 
  | 'newest'
  | 'oldest'
  | 'upcoming'
  | 'popular'
  | 'price_low'
  | 'price_high'

export type EventListQuery = {
  filters?: EventFilters
  sort?: EventSortOption
  page?: number
  limit?: number
}

// ============================================
// STATS & ANALYTICS
// ============================================

export type EventStats = {
  total_events: number
  published_events: number
  draft_events: number
  completed_events: number
  cancelled_events: number
  total_tickets_sold: number
  total_revenue: number
  upcoming_events: number
}

export type EventDetailStats = {
  event: EventWithDetails
  total_tickets_sold: number
  total_revenue: number
  tickets_by_type: {
    ticket_type_id: string
    name: string
    sold_count: number
    revenue: number
  }[]
  attendance_rate: number // current_attendees / max_attendees
  days_until_event: number
}

// ============================================
// VALIDATION SCHEMAS (for use with Zod later)
// ============================================

export const EVENT_VALIDATION = {
  title: {
    min: 3,
    max: 200,
  },
  slug: {
    min: 3,
    max: 200,
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, // kebab-case only
  },
  description: {
    max: 500,
  },
  price: {
    min: 0,
    max: 999999999,
  },
  quantity: {
    min: 1,
    max: 999999,
  },
  max_attendees: {
    min: 1,
    max: 999999,
  },
}

// ============================================
// HELPER TYPES
// ============================================

export type EventAction = 
  | { type: 'create'; event: Event }
  | { type: 'update'; event: Event }
  | { type: 'delete'; event_id: string }
  | { type: 'publish'; event_id: string }
  | { type: 'cancel'; event_id: string }
  | { type: 'complete'; event_id: string }

export type TicketAvailability = {
  ticket_type_id: string
  is_available: boolean
  reason?: 'sold_out' | 'not_started' | 'ended' | 'inactive'
  available_quantity: number
}