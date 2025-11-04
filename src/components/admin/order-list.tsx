'use client'

import Link from 'next/link'
import {
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Calendar,
  User,
  DollarSign,
} from 'lucide-react'

type OrderData = {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  final_amount: number
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  order_status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  paid_at: string | null
  event: {
    id: string
    title: string
    slug: string
  }
}

type OrderListProps = {
  orders: OrderData[]
  currentPage: number
  totalPages: number
}

export function OrderList({ orders, currentPage, totalPages }: OrderListProps) {
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Chờ thanh toán
          </span>
        )
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Đã thanh toán
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Thất bại
          </span>
        )
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Đã hoàn tiền
          </span>
        )
      default:
        return null
    }
  }

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

  // Filter out orders with invalid data
  const validOrders =
    orders?.filter((order) => order && order.event) || []

  if (validOrders.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Không tìm thấy đơn hàng nào</p>
        <p className="text-slate-500 text-sm mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Mã đơn hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Sự kiện
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {validOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm font-medium text-slate-900">
                      {order.order_number}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">
                      {order.customer_name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{order.customer_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/events/${order.event.slug}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {order.event.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-slate-900">
                      {formatPrice(order.final_amount)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getPaymentStatusBadge(order.payment_status)}
                    {order.paid_at && (
                      <div className="text-xs text-slate-500 mt-1">
                        {formatDate(order.paid_at)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-200">
          {validOrders.map((order) => (
            <div key={order.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-mono text-sm font-medium text-slate-900">
                    {order.order_number}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mt-1">
                    {formatPrice(order.final_amount)}
                  </div>
                </div>
                {getPaymentStatusBadge(order.payment_status)}
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-900">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ShoppingCart className="w-4 h-4 text-slate-400" />
                  <Link
                    href={`/events/${order.event.slug}`}
                    className="text-blue-600 hover:underline"
                  >
                    {order.event.title}
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{formatDate(order.created_at)}</span>
                </div>
              </div>

              <Link
                href={`/admin/orders/${order.id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Xem chi tiết
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-slate-600">
            Trang {currentPage} / {totalPages}
          </div>

          <div className="flex items-center gap-2">
            {currentPage > 1 && (
              <Link
                href={`?page=${currentPage - 1}`}
                className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Trước
              </Link>
            )}

            {currentPage < totalPages && (
              <Link
                href={`?page=${currentPage + 1}`}
                className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Sau
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
