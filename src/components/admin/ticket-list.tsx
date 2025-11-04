'use client'

import Link from 'next/link'
import {
  Eye,
  XCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Mail,
  Ticket
} from 'lucide-react'

type TicketData = {
  id: string
  ticket_number: string
  status: 'active' | 'used' | 'cancelled'
  holder_name: string
  holder_email: string
  holder_phone: string | null
  qr_code_url: string | null
  created_at: string
  checked_in_at: string | null
  order: {
    id: string
    order_number: string
    customer_name: string
    customer_email: string
    event: {
      id: string
      title: string
      slug: string
    }
  }
  ticket_type: {
    name: string
    price: number
  }
}

type TicketListProps = {
  tickets: TicketData[]
  currentPage: number
  totalPages: number
}

export function TicketList({ tickets, currentPage, totalPages }: TicketListProps) {

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Chưa dùng
          </span>
        )
      case 'used':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Đã check-in
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Đã hủy
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

  // Filter out tickets with invalid data
  const validTickets = tickets?.filter(
    (ticket) => ticket && ticket.order && ticket.order.event && ticket.ticket_type
  ) || []

  if (validTickets.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <Ticket className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Không tìm thấy vé nào</p>
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
                  Mã vé
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Người giữ vé
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Sự kiện
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Loại vé
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
              {validTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm font-medium text-slate-900">
                      {ticket.ticket_number}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {ticket.order.order_number}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">
                      {ticket.holder_name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {ticket.holder_email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/events/${ticket.order.event.slug}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {ticket.order.event.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">
                      {ticket.ticket_type.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatPrice(ticket.ticket_type.price)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(ticket.status)}
                    {ticket.checked_in_at && (
                      <div className="text-xs text-slate-500 mt-1">
                        {formatDate(ticket.checked_in_at)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(ticket.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/tickets/${ticket.id}`}
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
          {validTickets.map((ticket) => (
            <div key={ticket.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-mono text-sm font-medium text-slate-900">
                    {ticket.ticket_number}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {ticket.order.order_number}
                  </div>
                </div>
                {getStatusBadge(ticket.status)}
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-900">{ticket.holder_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{ticket.holder_email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Ticket className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-900">{ticket.ticket_type.name}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-600">{formatPrice(ticket.ticket_type.price)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{formatDate(ticket.created_at)}</span>
                </div>
              </div>

              <Link
                href={`/admin/tickets/${ticket.id}`}
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
