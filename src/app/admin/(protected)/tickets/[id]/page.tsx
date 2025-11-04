import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
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

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch ticket details
  const { data: ticket, error } = await supabase
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
          slug,
          location_name,
          location_address,
          start_date,
          end_date
        )
      ),
      ticket_type:ticket_types (
        name,
        price
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !ticket) {
    notFound()
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Chưa dùng
          </span>
        )
      case 'used':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Đã check-in
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Đã hủy
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
              href="/admin/tickets"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">Chi tiết vé</h1>
              <p className="text-sm text-slate-600 mt-0.5 font-mono">
                {ticket.ticket_number}
              </p>
            </div>
            {getStatusBadge(ticket.status)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - QR Code */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-slate-600" />
                Mã QR
              </h2>

              {ticket.qr_code_url ? (
                <div className="space-y-4">
                  <div className="bg-white border-2 border-slate-200 rounded-lg p-4 flex items-center justify-center">
                    <Image
                      src={ticket.qr_code_url}
                      alt={`QR Code for ${ticket.ticket_number}`}
                      width={250}
                      height={250}
                      className="w-full h-auto"
                    />
                  </div>
                  <a
                    href={ticket.qr_code_url}
                    download={`${ticket.ticket_number}.png`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Tải QR Code
                  </a>
                </div>
              ) : (
                <div className="w-full aspect-square bg-slate-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Không có QR code</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-600" />
                Thông tin sự kiện
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-600 mb-1">Tên sự kiện</div>
                  <Link
                    href={`/events/${ticket.order.event.slug}`}
                    className="text-lg font-medium text-blue-600 hover:underline"
                  >
                    {ticket.order.event.title}
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Thời gian bắt đầu</div>
                    <div className="text-base text-slate-900">
                      {formatDate(ticket.order.event.start_date)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Thời gian kết thúc</div>
                    <div className="text-base text-slate-900">
                      {formatDate(ticket.order.event.end_date)}
                    </div>
                  </div>
                </div>

                {ticket.order.event.location_name && (
                  <div>
                    <div className="text-sm text-slate-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Địa điểm
                    </div>
                    <div className="text-base text-slate-900">
                      {ticket.order.event.location_name}
                    </div>
                    {ticket.order.event.location_address && (
                      <div className="text-sm text-slate-500 mt-0.5">
                        {ticket.order.event.location_address}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Info */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-slate-600" />
                Thông tin vé
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-600 mb-1">Loại vé</div>
                  <div className="text-base text-slate-900">{ticket.ticket_type.name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Giá vé</div>
                  <div className="text-base font-semibold text-slate-900">
                    {formatPrice(ticket.ticket_type.price)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Ngày tạo</div>
                  <div className="text-base text-slate-900">{formatDate(ticket.created_at)}</div>
                </div>
                {ticket.checked_in_at && (
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Thời gian check-in</div>
                    <div className="text-base font-medium text-blue-600">
                      {formatDate(ticket.checked_in_at)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Holder Info */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-slate-600" />
                Thông tin người giữ vé
              </h2>

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

            {/* Order Info */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-600" />
                Thông tin đơn hàng
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-600 mb-1">Mã đơn hàng</div>
                  <div className="text-base font-mono text-slate-900">
                    {ticket.order.order_number}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Người đặt</div>
                  <div className="text-base text-slate-900">{ticket.order.customer_name}</div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {ticket.order.customer_email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
