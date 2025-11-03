'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createOrder, type CheckoutItem } from '@/app/checkout/actions'
import Image from 'next/image'

type CheckoutFormProps = {
  event: any
  user: any
  profile: any
}

export default function CheckoutForm({ event, user, profile }: CheckoutFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Parse selected tickets from URL query params
  const getSelectedTickets = (): Record<string, number> => {
    const tickets: Record<string, number> = {}
    searchParams.forEach((value, key) => {
      if (key.startsWith('ticket_')) {
        const ticketId = key.replace('ticket_', '')
        const quantity = parseInt(value, 10)
        if (quantity > 0) {
          tickets[ticketId] = quantity
        }
      }
    })
    return tickets
  }

  const selectedTickets = getSelectedTickets()

  // Calculate order details
  const orderItems: CheckoutItem[] = []
  let subtotal = 0

  Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
    const ticketType = event.ticket_types?.find((t: any) => t.id === ticketId)
    if (ticketType) {
      orderItems.push({
        ticketTypeId: ticketType.id,
        ticketTypeName: ticketType.name,
        price: ticketType.price,
        quantity,
        pointsEarned: ticketType.points_earned || 0,
      })
      subtotal += ticketType.price * quantity
    }
  })

  const totalAmount = subtotal // TODO: Apply discount if voucher is used

  // Form state
  const [formData, setFormData] = useState({
    customerName: profile?.full_name || '',
    customerEmail: user?.email || '',
    customerPhone: profile?.phone || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
      setError('Vui lòng điền đầy đủ thông tin')
      setLoading(false)
      return
    }

    if (orderItems.length === 0) {
      setError('Vui lòng chọn ít nhất một loại vé')
      setLoading(false)
      return
    }

    try {
      const result = await createOrder({
        eventId: event.id,
        items: orderItems,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        userId: user?.id,
      })

      if (result.success && result.orderId) {
        // Redirect to payment page
        router.push(`/checkout/payment?order=${result.orderId}`)
      } else {
        setError(result.error || 'Không thể tạo đơn hàng')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError('Đã xảy ra lỗi khi tạo đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  if (orderItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Không có vé nào được chọn.</p>
        <button
          onClick={() => router.push(`/events/${event.slug}`)}
          className="mt-4 text-blue-600 hover:underline"
        >
          ← Quay lại trang sự kiện
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Order summary - Right side on desktop */}
      <div className="lg:col-span-1 order-first lg:order-last">
        <div className="bg-white rounded-lg shadow p-6 sticky top-6">
          <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>

          {/* Event info */}
          <div className="mb-4 pb-4 border-b">
            {event.featured_image && (
              <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                <Image
                  src={event.featured_image}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <h3 className="font-medium text-lg">{event.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(event.start_date).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Order items */}
          <div className="space-y-3 mb-4">
            {orderItems.map((item) => (
              <div key={item.ticketTypeId} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{item.ticketTypeName}</p>
                  <p className="text-gray-600">SL: {item.quantity}</p>
                </div>
                <p className="font-medium">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                </p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Tạm tính:</span>
              <span>{subtotal.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Tổng cộng:</span>
              <span className="text-blue-600">{totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {/* Points info */}
          {user && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                🎁 Bạn sẽ nhận được{' '}
                <span className="font-bold">
                  {orderItems.reduce(
                    (sum, item) => sum + item.pointsEarned * item.quantity,
                    0
                  )}
                </span>{' '}
                điểm thưởng
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Checkout form - Left side */}
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Thông tin khách hàng</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Customer info */}
          <div className="space-y-4">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customerName"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập họ và tên"
                required
              />
            </div>

            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="customerEmail"
                value={formData.customerEmail}
                onChange={(e) =>
                  setFormData({ ...formData, customerEmail: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@example.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Vé điện tử sẽ được gửi đến email này
              </p>
            </div>

            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData({ ...formData, customerPhone: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0123456789"
                required
              />
            </div>
          </div>

          {/* Terms */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Tôi đồng ý với{' '}
                <a href="/terms" className="text-blue-600 hover:underline">
                  điều khoản sử dụng
                </a>{' '}
                và{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  chính sách bảo mật
                </a>
              </span>
            </label>
          </div>

          {/* Submit button */}
          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => router.push(`/events/${event.slug}`)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
