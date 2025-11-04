import { createClient } from '@/lib/supabase/server'
import { OrderList } from '@/components/admin/order-list'
import { OrderFilters } from '@/components/admin/order-filters'
import { Suspense } from 'react'

type SearchParams = Promise<{
  status?: string
  search?: string
  page?: string
}>

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Get filters from search params
  const status = params.status
  const search = params.search
  const page = parseInt(params.page || '1')
  const perPage = 50

  // Build query
  let query = supabase
    .from('orders')
    .select(
      `
      *,
      event:events (
        id,
        title,
        slug
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  // Apply filters
  if (status) {
    query = query.eq('payment_status', status)
  }

  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`
    )
  }

  // Pagination
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  query = query.range(from, to)

  const { data: orders, count, error } = await query

  if (error) {
    console.error('Error fetching orders:', error)
  }

  // Calculate stats
  const { data: stats } = await supabase.from('orders').select('payment_status')

  const totalOrders = stats?.length || 0
  const pendingOrders = stats?.filter((o) => o.payment_status === 'pending').length || 0
  const paidOrders = stats?.filter((o) => o.payment_status === 'paid').length || 0
  const failedOrders = stats?.filter((o) => o.payment_status === 'failed').length || 0

  const totalPages = count ? Math.ceil(count / perPage) : 1

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý đơn hàng</h1>
          <p className="text-slate-600 mt-1">Tổng số {count?.toLocaleString() || 0} đơn hàng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Tổng đơn hàng</div>
          <div className="text-2xl font-bold text-slate-900">{totalOrders.toLocaleString()}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Chờ thanh toán</div>
          <div className="text-2xl font-bold text-orange-600">{pendingOrders.toLocaleString()}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Đã thanh toán</div>
          <div className="text-2xl font-bold text-green-600">{paidOrders.toLocaleString()}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Thất bại</div>
          <div className="text-2xl font-bold text-red-600">{failedOrders.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters />

      {/* Order List */}
      <Suspense
        fallback={
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4" />
            <p className="text-slate-600">Đang tải...</p>
          </div>
        }
      >
        <OrderList orders={orders || []} currentPage={page} totalPages={totalPages} />
      </Suspense>
    </div>
  )
}
