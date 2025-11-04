'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scanner } from '@yudiel/react-qr-scanner'
import { ArrowLeft, Camera, SwitchCamera, Upload } from 'lucide-react'

type QRScannerProps = {
  onScanSuccess: (decodedText: string) => void
  onScanError?: (error: string) => void
  isProcessing?: boolean
}

export function QRScanner({ onScanSuccess, onScanError, isProcessing }: QRScannerProps) {
  const router = useRouter()
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [error, setError] = useState<string | null>(null)

  const handleScan = (result: any) => {
    if (result && result[0]?.rawValue) {
      console.log('✅ QR detected:', result[0].rawValue)
      onScanSuccess(result[0].rawValue)
    }
  }

  const handleError = (error: any) => {
    console.error('❌ Scanner error:', error)
    setError('Không thể khởi động camera')
    onScanError?.('Không thể khởi động camera')
  }

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Camera Preview - Full Screen */}
      <div className="flex-1 relative">
        {!isProcessing && (
          <Scanner
            onScan={handleScan}
            onError={handleError}
            constraints={{
              facingMode: facingMode,
              aspectRatio: 1
            }}
            components={{
              finder: true,
            }}
            styles={{
              container: {
                width: '100%',
                height: '100%',
              },
              video: {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              },
            }}
          />
        )}

        {/* Back Button - Top Left */}
        <button
          onClick={() => router.back()}
          disabled={isProcessing}
          className="absolute top-4 left-4 z-10 p-3 bg-black bg-opacity-60 hover:bg-opacity-80 rounded-full text-white transition-all disabled:opacity-50"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Guide Text */}
        <div className="absolute bottom-32 left-0 right-0 text-center pointer-events-none">
          <p className="text-white text-lg font-semibold bg-black bg-opacity-50 py-2 px-4 inline-block rounded-lg">
            Đưa mã QR vào khung hình
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="absolute top-20 left-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-20">
            <p className="font-semibold">{error}</p>
            <button
              onClick={() => {
                setError(null)
                window.location.reload()
              }}
              className="mt-2 px-4 py-2 bg-white text-red-500 rounded-lg font-semibold"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-30">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
              <p className="text-xl font-semibold">Đang xử lý...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls - Bottom Bar */}
      <div className="bg-black bg-opacity-90 p-6 safe-bottom">
        <div className="flex items-center justify-center gap-8 max-w-md mx-auto">
          {/* Switch Camera */}
          <button
            onClick={switchCamera}
            disabled={isProcessing}
            className="flex flex-col items-center gap-2 p-3 text-white disabled:opacity-30 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all"
          >
            <SwitchCamera className="w-8 h-8" />
            <span className="text-xs">Đổi camera</span>
          </button>

          {/* Camera Icon (Center) */}
          <div className="flex flex-col items-center gap-2 p-3">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs text-white opacity-75">
              {facingMode === 'environment' ? 'Camera sau' : 'Camera trước'}
            </span>
          </div>

          {/* Placeholder for symmetry */}
          <div className="w-20"></div>
        </div>
      </div>

      {/* Safe area spacing for iOS */}
      <style jsx>{`
        .safe-bottom {
          padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  )
}
