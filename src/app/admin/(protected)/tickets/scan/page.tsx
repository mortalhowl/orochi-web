'use client'

import { useState } from 'react'
import { QRScanner } from '@/components/admin/qr-scanner'
import { CheckInResultDisplay } from '@/components/admin/checkin-result'
import { checkInTicket, getRecentCheckIns, CheckInResult } from '../actions'
import { useRouter } from 'next/navigation'
import { Camera, History, BarChart3 } from 'lucide-react'

export default function ScanTicketPage() {
  const router = useRouter()
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, pending: 0 })

  // Admin user ID - in production, get from session
  const [adminUserId, setAdminUserId] = useState<string>('')

  // Get admin user on mount
  useState(() => {
    // Get from Supabase auth
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient()
        .auth.getUser()
        .then(({ data: { user } }) => {
          if (user) {
            setAdminUserId(user.id)
          }
        })
    })
  })

  const handleScan = async (ticketNumber: string) => {
    if (isProcessing) return

    setIsProcessing(true)

    try {
      // Check in the ticket
      const checkInResult = await checkInTicket(ticketNumber, adminUserId)
      setResult(checkInResult)

      // Play sound based on result
      if (checkInResult.success) {
        playSuccessSound()
      } else {
        playErrorSound()
      }

      // Refresh stats
      loadRecentCheckIns()
    } catch (error) {
      console.error('Error checking in ticket:', error)
      setResult({
        success: false,
        message: 'Đã xảy ra lỗi khi check-in',
        error: 'UNKNOWN_ERROR',
      })
      playErrorSound()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCloseResult = () => {
    setResult(null)
  }

  const loadRecentCheckIns = async () => {
    const checkIns = await getRecentCheckIns(10)
    setRecentCheckIns(checkIns)

    // Update stats
    const today = new Date().toISOString().split('T')[0]
    const todayCheckIns = checkIns.filter((c: any) =>
      c.checked_in_at.startsWith(today)
    )
    setStats((prev) => ({
      ...prev,
      checkedIn: todayCheckIns.length,
    }))
  }

  const playSuccessSound = () => {
    // Play success sound (can use Web Audio API or audio element)
    const audio = new Audio('/sounds/success.mp3')
    audio.play().catch(() => {
      // Ignore if sound fails
    })
  }

  const playErrorSound = () => {
    const audio = new Audio('/sounds/error.mp3')
    audio.play().catch(() => {
      // Ignore if sound fails
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Quét vé Check-in</h1>
        <p className="text-gray-600">Quét mã QR trên vé để check-in tham dự sự kiện</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đã check-in hôm nay</p>
              <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Chờ check-in</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Camera className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <button
            onClick={() => {
              setShowHistory(!showHistory)
              if (!showHistory) loadRecentCheckIns()
            }}
            className="flex items-center justify-between w-full"
          >
            <div className="text-left">
              <p className="text-sm text-gray-500">Lịch sử gần đây</p>
              <p className="text-2xl font-bold text-blue-600">{recentCheckIns.length}</p>
            </div>
            <History className="w-8 h-8 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Scanner */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Camera className="w-6 h-6" />
          Camera quét QR
        </h2>

        {isProcessing && (
          <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
            <p className="font-semibold">Đang xử lý...</p>
          </div>
        )}

        <QRScanner onScanSuccess={handleScan} isProcessing={isProcessing} />
      </div>

      {/* Recent Check-ins */}
      {showHistory && recentCheckIns.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <History className="w-6 h-6" />
            Check-in gần đây
          </h2>

          <div className="space-y-3">
            {recentCheckIns.map((checkIn: any) => (
              <div
                key={checkIn.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold">{checkIn.ticket?.holder_name}</p>
                  <p className="text-sm text-gray-600">{checkIn.event?.title}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {checkIn.ticket?.ticket_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(checkIn.checked_in_at).toLocaleTimeString('vi-VN')}
                  </p>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Đã check-in
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result Modal */}
      <CheckInResultDisplay result={result} onClose={handleCloseResult} />
    </div>
  )
}
