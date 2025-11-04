'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  X,
  Download,
  User,
  Mail,
  Phone,
  Ticket,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  DollarSign,
  QrCode,
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

type TicketDetailModalProps = {
  ticket: TicketData
  onClose: () => void
}

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Chưa dùng
          </span>
        )
      case 'used':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Đã check-in
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Đã hủy
          </span>
        )
      default:
        return null
    }
  }

  const downloadQRCode = async () => {
    if (!ticket.qr_code_url) return

    setIsDownloading(true)
    try {
      const response = await fetch(ticket.qr_code_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${ticket.ticket_number}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading QR code:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Chi tiết vé</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              {ticket.ticket_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & QR Code */}
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* QR Code */}
            {ticket.qr_code_url ? (
              <div className="flex-shrink-0">
                <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
                  <Image
                    src={ticket.qr_code_url}
                    alt={`QR Code for ${ticket.ticket_number}`}
                    width={200}
                    height={200}
                    className="w-48 h-48"
                  />
                </div>
                <button
                  onClick={downloadQRCode}
                  disabled={isDownloading}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isDownloading ? 'Đang tải...' : 'Tải QR Code'}
                </button>
              </div>
            ) : (
              <div className="flex-shrink-0 w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                <QrCode className="w-12 h-12 text-slate-400" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="text-sm text-slate-600 mb-1">Trạng thái</div>
                {getStatusBadge(ticket.status)}
              </div>

              {ticket.checked_in_at && (
                <div>
                  <div className="text-sm text-slate-600 mb-1">Thời gian check-in</div>
                  <div className="text-base font-medium text-slate-900">
                    {formatDate(ticket.checked_in_at)}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm text-slate-600 mb-1">Sự kiện</div>
                <div className="text-base font-medium text-slate-900">
                  {ticket.order.event.title}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-600 mb-1">Loại vé</div>
                <div className="text-base font-medium text-slate-900">
                  {ticket.ticket_type.name} - {formatPrice(ticket.ticket_type.price)}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200" />

          {/* Ticket Holder Info */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-600" />
              Thông tin người giữ vé
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-600 mb-1">Họ tên</div>
                <div className="text-base text-slate-900">{ticket.holder_name}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Email</div>
                <div className="text-base text-slate-900">{ticket.holder_email}</div>
              </div>
              {ticket.holder_phone && (
                <div>
                  <div className="text-sm text-slate-600 mb-1">Số điện thoại</div>
                  <div className="text-base text-slate-900">{ticket.holder_phone}</div>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200" />

          {/* Order Info */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-slate-600" />
              Thông tin đơn hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-600 mb-1">Mã đơn hàng</div>
                <div className="text-base font-mono text-slate-900">{ticket.order.order_number}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Người đặt</div>
                <div className="text-base text-slate-900">
                  {ticket.order.customer_name}
                </div>
                <div className="text-sm text-slate-500 mt-0.5">
                  {ticket.order.customer_email}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Ngày tạo vé</div>
                <div className="text-base text-slate-900">{formatDate(ticket.created_at)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
