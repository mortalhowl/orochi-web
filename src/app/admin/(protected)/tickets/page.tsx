import { createClient } from '@/lib/supabase/server'
import { TicketList } from '@/components/admin/ticket-list'
import { TicketFilters } from '@/components/admin/ticket-filters'
import { Suspense } from 'react'
import Link from 'next/link'
import { QrCode } from 'lucide-react'

type SearchParams = Promise<{
  event?: string
  status?: string
  search?: string
  page?: string
}>

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Get filters from search params
  const eventId = params.event
  const status = params.status
  const search = params.search
  const page = parseInt(params.page || '1')
  const perPage = 50

  // Build query
  let query = supabase
    .from('tickets')
    .select(
      `
      *,
      order:orders (
        id,
        order_number,
        customer_name,
        customer_email,
        event:events (
          id,
          title,
          slug
        )
      ),
      ticket_type:ticket_types (
        name,
        price
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  // Apply filters
  if (eventId) {
    query = query.eq('order.event_id', eventId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`ticket_number.ilike.%${search}%,holder_name.ilike.%${search}%,holder_email.ilike.%${search}%`)
  }

  // Pagination
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  query = query.range(from, to)

  const { data: tickets, count, error } = await query

  if (error) {
    console.error('Error fetching tickets:', error)
  }

  // Get events for filter dropdown
  const { data: events } = await supabase
    .from('events')
    .select('id, title')
    .order('start_date', { ascending: false })
    .limit(20)

  // Calculate stats
  const { data: stats } = await supabase
    .from('tickets')
    .select('status')

  const totalTickets = stats?.length || 0
  const activeTickets = stats?.filter(t => t.status === 'active').length || 0
  const usedTickets = stats?.filter(t => t.status === 'used').length || 0
  const cancelledTickets = stats?.filter(t => t.status === 'cancelled').length || 0

  const totalPages = count ? Math.ceil(count / perPage) : 1

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý vé</h1>
          <p className="text-slate-600 mt-1">
            Tổng số {count?.toLocaleString() || 0} vé
          </p>
        </div>

        <Link
          href="/admin/tickets/scan"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <QrCode className="w-5 h-5" />
          Quét QR
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Tổng vé</div>
          <div className="text-2xl font-bold text-slate-900">{totalTickets.toLocaleString()}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Vé chưa dùng</div>
          <div className="text-2xl font-bold text-green-600">{activeTickets.toLocaleString()}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Đã check-in</div>
          <div className="text-2xl font-bold text-blue-600">{usedTickets.toLocaleString()}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Đã hủy</div>
          <div className="text-2xl font-bold text-red-600">{cancelledTickets.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <TicketFilters events={events || []} />

      {/* Ticket List */}
      <Suspense
        fallback={
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4" />
            <p className="text-slate-600">Đang tải...</p>
          </div>
        }
      >
        <TicketList
          tickets={tickets || []}
          currentPage={page}
          totalPages={totalPages}
        />
      </Suspense>
    </div>
  )
}
