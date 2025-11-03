'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type PaymentViewProps = {
  order: any
}

export default function PaymentView({ order }: PaymentViewProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiresAt = new Date(order.expires_at)
      const now = new Date()
      const diff = expiresAt.getTime() - now.getTime()
      return Math.max(0, Math.floor(diff / 1000))
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)

      if (newTimeLeft === 0) {
        clearInterval(timer)
        router.refresh()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [order.expires_at, router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Payment instructions - Left side */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Thanh toán đơn hàng</h1>
          <div className="flex items-center gap-2 text-orange-600">
            <span className="text-2xl">⏱️</span>
            <span className="text-xl font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Order info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Mã đơn hàng</p>
          <p className="text-lg font-bold">{order.order_number}</p>
          <p className="text-sm text-gray-600 mt-3 mb-1">Số tiền cần thanh toán</p>
          <p className="text-2xl font-bold text-blue-600">
            {order.final_amount.toLocaleString('vi-VN')} đ
          </p>
        </div>

        {/* QR Code */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">
            Quét mã QR để thanh toán
          </h2>
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 flex justify-center">
            {order.payment_qr_code ? (
              <div className="relative w-64 h-64">
                <Image
                  src={order.payment_qr_code}
                  alt="VietQR Payment"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                <p className="text-gray-500">Không thể tải mã QR</p>
              </div>
            )}
          </div>
          <p className="text-sm text-center text-gray-600 mt-3">
            Sử dụng ứng dụng ngân hàng để quét mã QR
          </p>
        </div>

        {/* Bank transfer info */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold mb-3 text-blue-900">
            Hoặc chuyển khoản thủ công:
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Ngân hàng:</span>
              <span className="font-medium">{order.payment_bank_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Số tài khoản:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{order.payment_bank_account}</span>
                <button
                  onClick={() => copyToClipboard(order.payment_bank_account)}
                  className="text-blue-600 hover:text-blue-700"
                  title="Copy"
                >
                  📋
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Nội dung CK:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{order.transaction_code}</span>
                <button
                  onClick={() => copyToClipboard(order.transaction_code)}
                  className="text-blue-600 hover:text-blue-700"
                  title="Copy"
                >
                  📋
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Số tiền:</span>
              <span className="font-mono font-medium">
                {order.final_amount.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
          {copied && (
            <div className="mt-2 text-sm text-green-600 text-center">
              ✓ Đã copy vào clipboard
            </div>
          )}
        </div>

        {/* Important note */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm font-semibold text-yellow-800 mb-2">
            ⚠️ Lưu ý quan trọng:
          </p>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Chuyển khoản đúng nội dung: <strong>{order.transaction_code}</strong></li>
            <li>Chuyển khoản đúng số tiền: <strong>{order.final_amount.toLocaleString('vi-VN')} đ</strong></li>
            <li>Đơn hàng sẽ hết hạn sau {formatTime(timeLeft)}</li>
            <li>Admin sẽ xác nhận thanh toán trong vòng 5-10 phút</li>
            <li>Vé điện tử sẽ được gửi qua email sau khi xác nhận</li>
          </ul>
        </div>
      </div>

      {/* Order summary - Right side */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Chi tiết đơn hàng</h2>

        {/* Event info */}
        <div className="mb-6">
          {order.event.featured_image && (
            <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden">
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
            {order.event.location_name && (
              <p>📍 {order.event.location_name}</p>
            )}
          </div>
        </div>

        {/* Customer info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Thông tin khách hàng</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-600">Họ tên:</span>{' '}
              <span className="font-medium">{order.customer_name}</span>
            </p>
            <p>
              <span className="text-gray-600">Email:</span>{' '}
              <span className="font-medium">{order.customer_email}</span>
            </p>
            <p>
              <span className="text-gray-600">SĐT:</span>{' '}
              <span className="font-medium">{order.customer_phone}</span>
            </p>
          </div>
        </div>

        {/* Tickets */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Danh sách vé</h3>
          <div className="space-y-3">
            {(order.items as any[]).map((item: any, index: number) => (
              <div
                key={index}
                className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{item.ticketTypeName}</p>
                  <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                  {item.pointsEarned > 0 && (
                    <p className="text-sm text-blue-600">
                      +{item.pointsEarned * item.quantity} điểm
                    </p>
                  )}
                </div>
                <p className="font-semibold">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t pt-4">
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

        {/* Payment status */}
        <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="animate-pulse w-3 h-3 bg-orange-500 rounded-full"></div>
            <p className="font-semibold text-orange-800">Đang chờ thanh toán</p>
          </div>
          <p className="text-sm text-orange-700">
            Sau khi chuyển khoản thành công, vui lòng chờ admin xác nhận thanh toán.
            Vé điện tử sẽ được gửi qua email <strong>{order.customer_email}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
