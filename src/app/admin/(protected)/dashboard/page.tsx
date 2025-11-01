// src/app/admin/(protected)/dashboard/page.tsx
// QUAN TRỌNG: File này KHÔNG cần check auth nữa vì layout đã check rồi!

import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  
  // KHÔNG cần check user nữa, layout đã check rồi
  // Chỉ cần lấy data thôi
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get admin info - KHÔNG cần check null vì layout đã đảm bảo có rồi
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select(`
      *,
      role:roles(*),
      profile:profiles(*)
    `)
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .single()

  // Get dashboard stats
  const [
    { count: eventsCount },
    { count: ticketsCount },
    { count: ordersCount },
    { count: usersCount },
    { count: adminCount },
  ] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('tickets').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('admin_users').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  // Get recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total_amount,
      payment_status,
      created_at,
      user:profiles!orders_user_id_fkey(full_name, email),
      event:events!orders_event_id_fkey(title)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get recent events
  const { data: recentEvents } = await supabase
    .from('events')
    .select('id, title, status, start_date, current_attendees, max_attendees')
    .order('created_at', { ascending: false })
    .limit(5)

  // Revenue stats (this week)
  const { data: weekRevenue } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('payment_status', 'paid')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const totalWeekRevenue = weekRevenue?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Chào mừng, {adminUser?.profile?.full_name || user?.email}! 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Vai trò: <span className="font-semibold" style={{ color: adminUser?.role?.color }}>
            {adminUser?.role?.display_name}
          </span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Events */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tổng số sự kiện</p>
          <p className="text-3xl font-bold">{eventsCount || 0}</p>
        </div>

        {/* Tickets */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Vé đã bán</p>
          <p className="text-3xl font-bold">{ticketsCount || 0}</p>
        </div>

        {/* Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Doanh thu tuần này</p>
          <p className="text-3xl font-bold">{totalWeekRevenue.toLocaleString('vi-VN')} đ</p>
        </div>

        {/* Users */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Người dùng</p>
          <p className="text-3xl font-bold">{usersCount || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Đơn hàng gần đây</h2>
            <a href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700">
              Xem tất cả →
            </a>
          </div>

          <div className="space-y-3">
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{order.order_number}</p>
                    <p className="text-xs text-slate-500">{order.user?.full_name || order.user?.email}</p>
                    <p className="text-xs text-slate-400">{order.event?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{Number(order.total_amount).toLocaleString('vi-VN')} đ</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                Chưa có đơn hàng nào
              </div>
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sự kiện gần đây</h2>
            <a href="/admin/events" className="text-sm text-blue-600 hover:text-blue-700">
              Xem tất cả →
            </a>
          </div>

          <div className="space-y-3">
            {recentEvents && recentEvents.length > 0 ? (
              recentEvents.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(event.start_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {event.current_attendees}/{event.max_attendees}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.status === 'published' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : event.status === 'draft'
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {event.status === 'published' ? 'Đang diễn ra' : event.status === 'draft' ? 'Nháp' : event.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                Chưa có sự kiện nào
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <h2 className="text-lg font-semibold mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a
            href="/admin/events/create"
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow"
          >
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Tạo sự kiện</span>
          </a>

          <a
            href="/admin/tickets/scan"
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow"
          >
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span className="text-sm font-medium">Quét QR</span>
          </a>

          <a
            href="/admin/vouchers/create"
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow"
          >
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <span className="text-sm font-medium">Tạo voucher</span>
          </a>

          <a
            href="/admin/reports"
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow"
          >
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium">Báo cáo</span>
          </a>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span>Số admin đang hoạt động: <strong>{adminCount}</strong></span>
            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
            <span>Tổng người dùng: <strong>{usersCount}</strong></span>
          </div>
          <span>Hôm nay: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Dashboard - Admin Portal',
  description: 'Admin dashboard overview',
}