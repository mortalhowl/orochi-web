'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CheckInResult = {
  success: boolean
  message: string
  ticket?: {
    id: string
    ticket_number: string
    holder_name: string
    holder_email: string
    ticket_type_name: string
    event: {
      id: string
      title: string
      start_date: string
      location_name: string
    }
    status: string
    checked_in_at: string | null
  }
  error?: string
}

/**
 * Validate and check-in a ticket by scanning QR code
 */
export async function checkInTicket(
  ticketNumber: string,
  adminUserId: string,
  notes?: string
): Promise<CheckInResult> {
  const supabase = await createClient()

  try {
    // 1. Get ticket with event details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(
        `
        id,
        ticket_number,
        holder_name,
        holder_email,
        ticket_type_name,
        status,
        checked_in_at,
        event:events(
          id,
          title,
          start_date,
          end_date,
          location_name
        )
      `
      )
      .eq('ticket_number', ticketNumber)
      .single()

    if (ticketError || !ticket) {
      return {
        success: false,
        message: 'Không tìm thấy vé',
        error: 'TICKET_NOT_FOUND',
      }
    }

    // 2. Check ticket status
    if (ticket.status === 'cancelled') {
      return {
        success: false,
        message: 'Vé đã bị hủy',
        error: 'TICKET_CANCELLED',
        ticket: ticket as any,
      }
    }

    if (ticket.status === 'expired') {
      return {
        success: false,
        message: 'Vé đã hết hạn',
        error: 'TICKET_EXPIRED',
        ticket: ticket as any,
      }
    }

    if (ticket.status === 'used' && ticket.checked_in_at) {
      const checkedInDate = new Date(ticket.checked_in_at).toLocaleString('vi-VN')
      return {
        success: false,
        message: `Vé đã được sử dụng lúc ${checkedInDate}`,
        error: 'TICKET_ALREADY_USED',
        ticket: ticket as any,
      }
    }

    // 3. Check event dates
    const now = new Date()
    const eventStart = new Date(ticket.event.start_date)
    const eventEnd = new Date(ticket.event.end_date)

    // Allow check-in 2 hours before event
    const checkInWindowStart = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000)

    if (now < checkInWindowStart) {
      return {
        success: false,
        message: `Chưa đến giờ check-in. Có thể check-in từ ${checkInWindowStart.toLocaleString('vi-VN')}`,
        error: 'CHECK_IN_TOO_EARLY',
        ticket: ticket as any,
      }
    }

    if (now > eventEnd) {
      return {
        success: false,
        message: 'Sự kiện đã kết thúc',
        error: 'EVENT_ENDED',
        ticket: ticket as any,
      }
    }

    // 4. Update ticket status to 'used' and set check-in time
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'used',
        checked_in_at: new Date().toISOString(),
        checked_in_by: adminUserId,
        checked_in_notes: notes || null,
      })
      .eq('id', ticket.id)

    if (updateError) {
      console.error('Error updating ticket:', updateError)
      return {
        success: false,
        message: 'Lỗi khi cập nhật vé',
        error: 'UPDATE_ERROR',
      }
    }

    // 5. Log check-in activity
    await supabase.from('checkin_logs').insert({
      ticket_id: ticket.id,
      event_id: ticket.event.id,
      checked_in_by: adminUserId,
      checked_in_at: new Date().toISOString(),
      notes: notes || null,
    })

    // Refresh the page
    revalidatePath('/admin/tickets/scan')

    return {
      success: true,
      message: 'Check-in thành công!',
      ticket: {
        ...ticket,
        checked_in_at: new Date().toISOString(),
      } as any,
    }
  } catch (error) {
    console.error('Error in checkInTicket:', error)
    return {
      success: false,
      message: 'Đã xảy ra lỗi khi check-in',
      error: 'UNKNOWN_ERROR',
    }
  }
}

/**
 * Get ticket info without checking in (for preview)
 */
export async function getTicketInfo(ticketNumber: string): Promise<CheckInResult> {
  const supabase = await createClient()

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(
      `
      id,
      ticket_number,
      holder_name,
      holder_email,
      ticket_type_name,
      status,
      checked_in_at,
      event:events(
        id,
        title,
        start_date,
        location_name
      )
    `
    )
    .eq('ticket_number', ticketNumber)
    .single()

  if (error || !ticket) {
    return {
      success: false,
      message: 'Không tìm thấy vé',
      error: 'TICKET_NOT_FOUND',
    }
  }

  return {
    success: true,
    message: 'Tìm thấy vé',
    ticket: ticket as any,
  }
}

/**
 * Get recent check-ins
 */
export async function getRecentCheckIns(limit = 20) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('checkin_logs')
    .select(
      `
      id,
      checked_in_at,
      notes,
      ticket:tickets(
        ticket_number,
        holder_name,
        ticket_type_name
      ),
      event:events(
        title
      )
    `
    )
    .order('checked_in_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching check-ins:', error)
    return []
  }

  return data || []
}

/**
 * Get check-in statistics by event
 */
export async function getCheckInStats(eventId?: string) {
  const supabase = await createClient()

  let query = supabase.from('tickets').select('status', { count: 'exact', head: true })

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  const [totalResult, checkedInResult] = await Promise.all([
    query,
    query.eq('status', 'used'),
  ])

  return {
    total: totalResult.count || 0,
    checkedIn: checkedInResult.count || 0,
    pending: (totalResult.count || 0) - (checkedInResult.count || 0),
  }
}
