import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Edit2,
  User,
  Mail,
  Phone,
  Award,
  TrendingUp,
  Calendar,
  History,
  Ticket,
  ShoppingCart,
} from 'lucide-react'

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch user details
  const { data: user, error } = await supabase
    .from('profiles')
    .select(
      `
      *,
      rank:ranks(
        id,
        name,
        color,
        icon
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !user) {
    notFound()
  }

  // Get point transactions
  const { data: transactions } = await supabase
    .from('point_transactions')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get orders
  const { data: orders, count: ordersCount } = await supabase
    .from('orders')
    .select('*, event:events(id, title, slug)', { count: 'exact' })
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get tickets
  const { count: ticketsCount } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .in(
      'order_id',
      orders?.map((o) => o.id) || []
    )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'earn':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Tích điểm
          </span>
        )
      case 'redeem':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            Đổi điểm
          </span>
        )
      case 'bonus':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            Thưởng
          </span>
        )
      case 'refund':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            Hoàn điểm
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
            {type}
          </span>
        )
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Đã thanh toán
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            Chờ thanh toán
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            Thất bại
          </span>
        )
      case 'refunded':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            Đã hoàn tiền
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin/users"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">Chi tiết người dùng</h1>
              <p className="text-sm text-slate-600 mt-0.5">{user.email}</p>
            </div>
            <Link
              href={`/admin/users/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Chỉnh sửa
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6 sticky top-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.full_name || user.email}
                    width={120}
                    height={120}
                    className="h-30 w-30 rounded-full object-cover border-4 border-slate-100"
                  />
                ) : (
                  <div className="h-30 w-30 rounded-full bg-slate-200 flex items-center justify-center border-4 border-slate-100">
                    <User className="w-16 h-16 text-slate-500" />
                  </div>
                )}
                <h2 className="text-xl font-bold text-slate-900 mt-4 text-center">
                  {user.full_name || 'Chưa cập nhật'}
                </h2>
                {user.rank && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium mt-2"
                    style={{
                      backgroundColor: `${user.rank.color}20`,
                      color: user.rank.color,
                    }}
                  >
                    <Award className="w-4 h-4" />
                    {user.rank.name}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <TrendingUp className="w-4 h-4" />
                    Điểm hiện tại
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {user.current_points.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Award className="w-4 h-4" />
                    Tổng điểm
                  </div>
                  <span className="text-base font-semibold text-slate-900">
                    {user.total_points.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <History className="w-4 h-4" />
                    Điểm tích lũy
                  </div>
                  <span className="text-base font-semibold text-slate-900">
                    {user.lifetime_points.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <div className="text-sm text-slate-900 break-all">{user.email}</div>
                </div>
                {user.phone && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <Phone className="w-4 h-4" />
                      Số điện thoại
                    </div>
                    <div className="text-sm text-slate-900">{user.phone}</div>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    Ngày tham gia
                  </div>
                  <div className="text-sm text-slate-900">{formatDate(user.created_at)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activity Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Tổng đơn hàng</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {ordersCount?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Ticket className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Tổng vé</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {ticketsCount?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Point Transactions */}
            {transactions && transactions.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-600" />
                    Lịch sử điểm gần đây
                  </h2>
                </div>

                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getTransactionTypeBadge(transaction.type)}
                          <span className="text-sm text-slate-600">
                            {formatDate(transaction.created_at)}
                          </span>
                        </div>
                        <div className="text-sm text-slate-900">{transaction.reason}</div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.points > 0 ? '+' : ''}
                          {transaction.points.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          Còn: {transaction.balance_after.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            {orders && orders.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-slate-600" />
                    Đơn hàng gần đây
                  </h2>
                  <Link href={`/admin/orders?user=${id}`} className="text-sm text-blue-600 hover:underline">
                    Xem tất cả
                  </Link>
                </div>

                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono font-medium text-slate-900">
                            {order.order_number}
                          </span>
                          {getPaymentStatusBadge(order.payment_status)}
                        </div>
                        <Link
                          href={`/events/${order.event.slug}`}
                          className="text-sm text-slate-600 hover:text-blue-600"
                        >
                          {order.event.title}
                        </Link>
                        <div className="text-xs text-slate-500 mt-0.5">{formatDate(order.created_at)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-slate-900">
                          {formatPrice(order.final_amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
