'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { confirmOrderPayment } from '@/app/checkout/actions'

type OrderDetailViewProps = {
  order: any
  adminUserId: string
}

export default function OrderDetailView({ order, adminUserId }: OrderDetailViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state for verification
  const [verificationData, setVerificationData] = useState({
    bankTransactionId: '',
    bankTransactionAmount: order.final_amount,
    bankTransactionDate: new Date().toISOString().split('T')[0],
    verificationNote: '',
  })

  const handleConfirmPayment = async () => {
    if (!confirm('Xác nhận đơn hàng này đã được thanh toán?')) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await confirmOrderPayment({
        orderId: order.id,
        adminId: adminUserId,
        verificationNote: verificationData.verificationNote,
        bankTransactionId: verificationData.bankTransactionId || undefined,
        bankTransactionAmount: verificationData.bankTransactionAmount || undefined,
        bankTransactionDate: verificationData.bankTransactionDate || undefined,
      })

      if (result.success) {
        setSuccess(
          result.ticketsSent
            ? 'Đơn hàng đã được xác nhận và vé đã được gửi qua email!'
            : 'Đơn hàng đã được xác nhận nhưng gửi email thất bại. Vui lòng gửi lại thủ công.'
        )
        router.refresh()
      } else {
        setError(result.error || 'Không thể xác nhận đơn hàng')
      }
    } catch (err) {
      console.error('Error confirming payment:', err)
      setError('Đã xảy ra lỗi khi xác nhận thanh toán')
    } finally {
      setLoading(false)
    }
  }

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
        className={`px-4 py-2 rounded-full text-sm font-semibold border ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push('/admin/orders')}
            className="text-blue-600 hover:text-blue-700 mb-2 text-sm"
          >
            ← Quay lại danh sách
          </button>
          <h1 className="text-3xl font-bold">Chi tiết đơn hàng</h1>
          <p className="text-gray-600 mt-1 font-mono">{order.order_number}</p>
        </div>
        <div>{getPaymentStatusBadge(order.payment_status)}</div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - Left side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin sự kiện</h2>
            {order.event.featured_image && (
              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                <Image
                  src={order.event.featured_image}
                  alt={order.event.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <h3 className="font-semibold text-lg mb-2">{order.event.title}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                📅{' '}
                {new Date(order.event.start_date).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {order.event.location_name && <p>📍 {order.event.location_name}</p>}
            </div>
          </div>

          {/* Customer info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin khách hàng</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Họ và tên</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-medium">{order.customer_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Số điện thoại</p>
                <p className="font-medium">{order.customer_phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Ngày đặt hàng</p>
                <p className="font-medium">
                  {new Date(order.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>

          {/* Order items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Danh sách vé</h2>
            <div className="space-y-3">
              {(order.items as any[]).map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.ticketTypeName}</p>
                    <p className="text-sm text-gray-600">
                      {item.price.toLocaleString('vi-VN')} đ × {item.quantity}
                    </p>
                    {item.pointsEarned > 0 && (
                      <p className="text-sm text-blue-600">
                        Điểm thưởng: +{item.pointsEarned * item.quantity}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-lg">
                    {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Tạm tính:</span>
                <span>{order.subtotal.toLocaleString('vi-VN')} đ</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between items-center mb-2 text-green-600">
                  <span>Giảm giá:</span>
                  <span>-{order.discount_amount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div className="flex justify-between items-center font-bold text-xl pt-2 border-t">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">
                  {order.final_amount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          </div>

          {/* Tickets (if paid) */}
          {order.payment_status === 'paid' && order.tickets && order.tickets.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Danh sách vé đã tạo</h2>
              <div className="space-y-2">
                {order.tickets.map((ticket: any) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-mono text-sm font-semibold">{ticket.ticket_number}</p>
                      <p className="text-xs text-gray-600">{ticket.ticket_type_name}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ticket.status === 'valid'
                          ? 'bg-green-100 text-green-800'
                          : ticket.status === 'used'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {ticket.status === 'valid'
                        ? 'Có hiệu lực'
                        : ticket.status === 'used'
                        ? 'Đã sử dụng'
                        : 'Đã hủy'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right side */}
        <div className="lg:col-span-1">
          {/* Payment info */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin thanh toán</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Phương thức thanh toán</p>
                <p className="font-medium">Chuyển khoản ngân hàng (VietQR)</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Mã giao dịch</p>
                <p className="font-mono font-semibold text-blue-600">{order.transaction_code}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Ngân hàng</p>
                <p className="font-medium">{order.payment_bank_name}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Số tài khoản</p>
                <p className="font-mono font-medium">{order.payment_bank_account}</p>
              </div>
              {order.expires_at && (
                <div>
                  <p className="text-gray-600 mb-1">Hết hạn lúc</p>
                  <p className="font-medium">{new Date(order.expires_at).toLocaleString('vi-VN')}</p>
                </div>
              )}
            </div>

            {/* QR Code */}
            {order.payment_qr_code && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Mã QR thanh toán:</p>
                <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={order.payment_qr_code}
                    alt="VietQR Payment"
                    fill
                    className="object-contain p-4"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Verification form (if pending) */}
          {order.payment_status === 'pending' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Xác nhận thanh toán</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleConfirmPayment()
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">Mã giao dịch ngân hàng</label>
                  <input
                    type="text"
                    value={verificationData.bankTransactionId}
                    onChange={(e) =>
                      setVerificationData({
                        ...verificationData,
                        bankTransactionId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="FT12345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Số tiền thực nhận</label>
                  <input
                    type="number"
                    value={verificationData.bankTransactionAmount}
                    onChange={(e) =>
                      setVerificationData({
                        ...verificationData,
                        bankTransactionAmount: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={order.final_amount}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Ngày giao dịch</label>
                  <input
                    type="date"
                    value={verificationData.bankTransactionDate}
                    onChange={(e) =>
                      setVerificationData({
                        ...verificationData,
                        bankTransactionDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Ghi chú</label>
                  <textarea
                    value={verificationData.verificationNote}
                    onChange={(e) =>
                      setVerificationData({
                        ...verificationData,
                        verificationNote: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Ghi chú về giao dịch..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Đang xử lý...' : '✓ Xác nhận thanh toán & Gửi vé'}
                </button>
              </form>

              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  ⚠️ Sau khi xác nhận, hệ thống sẽ tự động tạo vé và gửi qua email cho khách hàng.
                </p>
              </div>
            </div>
          )}

          {/* Confirmation info (if paid) */}
          {order.payment_status === 'paid' && (
            <div className="bg-green-50 rounded-lg border border-green-200 p-6">
              <h2 className="text-lg font-semibold text-green-800 mb-3">
                ✓ Đã xác nhận thanh toán
              </h2>
              <div className="space-y-2 text-sm text-green-800">
                {order.confirmed_at && (
                  <p>Xác nhận lúc: {new Date(order.confirmed_at).toLocaleString('vi-VN')}</p>
                )}
                {order.paid_at && (
                  <p>Thanh toán lúc: {new Date(order.paid_at).toLocaleString('vi-VN')}</p>
                )}
                <p className="pt-2 border-t border-green-200">
                  Vé điện tử đã được gửi đến: <br />
                  <span className="font-semibold">{order.customer_email}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
