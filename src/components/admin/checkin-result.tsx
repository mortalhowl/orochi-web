'use client'

import { CheckInResult } from '@/app/admin/(protected)/tickets/actions'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

type CheckInResultProps = {
  result: CheckInResult | null
  onClose: () => void
}

export function CheckInResultDisplay({ result, onClose }: CheckInResultProps) {
  if (!result) return null

  const isSuccess = result.success
  const Icon = isSuccess ? CheckCircle : result.error === 'TICKET_ALREADY_USED' ? AlertCircle : XCircle

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Icon & Message */}
        <div className="text-center mb-6">
          <Icon
            className={`w-16 h-16 mx-auto mb-4 ${
              isSuccess
                ? 'text-green-500'
                : result.error === 'TICKET_ALREADY_USED'
                ? 'text-orange-500'
                : 'text-red-500'
            }`}
          />
          <h2
            className={`text-2xl font-bold mb-2 ${
              isSuccess
                ? 'text-green-600'
                : result.error === 'TICKET_ALREADY_USED'
                ? 'text-orange-600'
                : 'text-red-600'
            }`}
          >
            {result.message}
          </h2>
        </div>

        {/* Ticket Details */}
        {result.ticket && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
            <div>
              <p className="text-sm text-gray-500">Mã vé</p>
              <p className="font-mono font-semibold text-lg">{result.ticket.ticket_number}</p>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <p className="text-sm text-gray-500">Người tham dự</p>
              <p className="font-semibold">{result.ticket.holder_name}</p>
              <p className="text-sm text-gray-600">{result.ticket.holder_email}</p>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <p className="text-sm text-gray-500">Sự kiện</p>
              <p className="font-semibold">{result.ticket.event.title}</p>
              <p className="text-sm text-gray-600">
                {new Date(result.ticket.event.start_date).toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {result.ticket.event.location_name && (
                <p className="text-sm text-gray-600 mt-1">
                  📍 {result.ticket.event.location_name}
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-3">
              <p className="text-sm text-gray-500">Loại vé</p>
              <p className="font-semibold">{result.ticket.ticket_type_name}</p>
            </div>

            {result.ticket.checked_in_at && (
              <div className="border-t border-gray-200 pt-3">
                <p className="text-sm text-gray-500">Thời gian check-in</p>
                <p className="font-semibold">
                  {new Date(result.ticket.checked_in_at).toLocaleString('vi-VN')}
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-3">
              <p className="text-sm text-gray-500">Trạng thái</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  result.ticket.status === 'valid'
                    ? 'bg-green-100 text-green-800'
                    : result.ticket.status === 'used'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {result.ticket.status === 'valid'
                  ? 'Hợp lệ'
                  : result.ticket.status === 'used'
                  ? 'Đã sử dụng'
                  : result.ticket.status === 'cancelled'
                  ? 'Đã hủy'
                  : 'Hết hạn'}
              </span>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Quét vé tiếp theo
        </button>
      </div>
    </div>
  )
}
