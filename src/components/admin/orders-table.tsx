'use client'

import { useState } from 'react'
import Link from 'next/link'

type Order = {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  final_amount: number
  payment_status: string
  order_status: string
  created_at: string
  event: {
    title: string
  } | null
}

type OrdersTableProps = {
  orders: Order[]
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase()
    return (
      order.order_number.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      order.customer_email.toLowerCase().includes(query) ||
      order.event?.title.toLowerCase().includes(query)
    )
  })

  const getPaymentStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-orange-100 text-orange-800 border-orange-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      refunded: 'bg-gray-100 text-gray-800 border-gray-200',
    }

    const labels = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thất bại',
      refunded: 'Đã hoàn tiền',
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getOrderStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
    }

    const labels = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      cancelled: 'Đã hủy',
      completed: 'Hoàn thành',
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Tìm kiếm đơn hàng (mã đơn, tên khách hàng, email, sự kiện)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Mã đơn hàng
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Sự kiện
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Khách hàng
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Số tiền
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Thanh toán
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Đơn hàng
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Ngày tạo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Không tìm thấy đơn hàng nào
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{order.event?.title || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{order.customer_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold">
                      {order.final_amount.toLocaleString('vi-VN')} đ
                    </p>
                  </td>
                  <td className="px-4 py-3">{getPaymentStatusBadge(order.payment_status)}</td>
                  <td className="px-4 py-3">{getOrderStatusBadge(order.order_status)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString('vi-VN')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Chi tiết →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="p-4 border-t bg-gray-50">
        <p className="text-sm text-gray-600">
          Hiển thị <span className="font-semibold">{filteredOrders.length}</span> đơn hàng
          {searchQuery && ` (tìm kiếm: "${searchQuery}")`}
        </p>
      </div>
    </div>
  )
}
