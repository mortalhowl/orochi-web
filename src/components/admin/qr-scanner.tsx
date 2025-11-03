'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, SwitchCamera, Image as ImageIcon, X } from 'lucide-react'

type QRScannerProps = {
  onScanSuccess: (decodedText: string) => void
  onScanError?: (error: string) => void
  isProcessing?: boolean
}

export function QRScanner({ onScanSuccess, onScanError, isProcessing }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<any[]>([])
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qrCodeRegionId = 'qr-reader'

  // Get available cameras
  const loadCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras()
      if (devices && devices.length > 0) {
        // Sort: back camera first
        const sorted = devices.sort((a, b) => {
          const aIsBack = a.label.toLowerCase().includes('back') || a.label.toLowerCase().includes('rear')
          const bIsBack = b.label.toLowerCase().includes('back') || b.label.toLowerCase().includes('rear')
          if (aIsBack && !bIsBack) return -1
          if (!aIsBack && bIsBack) return 1
          return 0
        })
        setCameras(sorted)
        return sorted
      }
      return []
    } catch (err) {
      console.error('Error loading cameras:', err)
      return []
    }
  }

  const startScanner = async (cameraIndex?: number) => {
    try {
      setError(null)

      // Stop existing scanner
      if (scannerRef.current && isScanning) {
        await stopScanner()
      }

      // Load cameras if not loaded
      let availableCameras = cameras
      if (cameras.length === 0) {
        availableCameras = await loadCameras()
      }

      if (availableCameras.length === 0) {
        setError('Không tìm thấy camera')
        onScanError?.('Không tìm thấy camera')
        return
      }

      // Select camera
      const camIndex = cameraIndex !== undefined ? cameraIndex : currentCameraIndex
      const selectedCamera = availableCameras[camIndex]
      setCurrentCameraIndex(camIndex)

      // Initialize scanner
      const html5QrCode = new Html5Qrcode(qrCodeRegionId)
      scannerRef.current = html5QrCode

      // Start scanning
      await html5QrCode.start(
        selectedCamera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // SUCCESS: Stop camera immediately
          console.log('QR detected:', decodedText)
          await stopScanner()
          onScanSuccess(decodedText)
        },
        (errorMessage) => {
          // Silent errors (no QR found)
        }
      )

      setIsScanning(true)
    } catch (err: any) {
      console.error('Error starting scanner:', err)
      setError(err.message || 'Không thể khởi động camera')
      onScanError?.(err.message || 'Không thể khởi động camera')
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
        setIsScanning(false)
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }

  const switchCamera = async () => {
    if (cameras.length <= 1) return
    const nextIndex = (currentCameraIndex + 1) % cameras.length
    await startScanner(nextIndex)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Stop camera first
      if (isScanning) {
        await stopScanner()
      }

      // Scan from file
      const html5QrCode = new Html5Qrcode(qrCodeRegionId)
      const result = await html5QrCode.scanFile(file, true)
      onScanSuccess(result)
    } catch (err: any) {
      console.error('Error scanning file:', err)
      setError('Không tìm thấy mã QR trong ảnh')
    }
  }

  useEffect(() => {
    // Auto-start scanner on mount
    startScanner()

    // Cleanup on unmount
    return () => {
      stopScanner()
    }
  }, [])

  // Auto-stop when processing
  useEffect(() => {
    if (isProcessing && isScanning) {
      stopScanner()
    }
  }, [isProcessing])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Camera Preview - Full Screen */}
      <div className="flex-1 relative">
        <div
          id={qrCodeRegionId}
          className="w-full h-full"
        />

        {/* Overlay Guide */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-black bg-opacity-50" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-64 h-64 border-4 border-white rounded-lg" />
              <p className="text-white text-center mt-4 text-sm font-semibold">
                Đưa mã QR vào khung này
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
            <p className="font-semibold">{error}</p>
            <button
              onClick={() => startScanner()}
              className="mt-2 px-4 py-2 bg-white text-red-500 rounded-lg font-semibold"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
              <p className="text-xl font-semibold">Đang xử lý...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls - Bottom Bar */}
      <div className="bg-black bg-opacity-90 p-4 safe-bottom">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Upload from Gallery */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex flex-col items-center gap-1 p-3 text-white disabled:opacity-50"
          >
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs">Thư viện</span>
          </button>

          {/* Start/Stop Button */}
          {!isScanning ? (
            <button
              onClick={() => startScanner()}
              disabled={isProcessing}
              className="flex flex-col items-center gap-1 p-3 bg-white rounded-full disabled:opacity-50"
            >
              <Camera className="w-12 h-12 text-black" />
            </button>
          ) : (
            <button
              onClick={stopScanner}
              disabled={isProcessing}
              className="flex flex-col items-center gap-1 p-3 bg-red-500 rounded-full disabled:opacity-50"
            >
              <X className="w-12 h-12 text-white" />
            </button>
          )}

          {/* Switch Camera */}
          <button
            onClick={switchCamera}
            disabled={!isScanning || cameras.length <= 1 || isProcessing}
            className="flex flex-col items-center gap-1 p-3 text-white disabled:opacity-30"
          >
            <SwitchCamera className="w-8 h-8" />
            <span className="text-xs">Đổi camera</span>
          </button>
        </div>

        {/* Camera Info */}
        {cameras.length > 0 && (
          <p className="text-white text-center text-xs mt-2 opacity-75">
            {cameras[currentCameraIndex]?.label || 'Camera'}
          </p>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Safe area spacing for iOS */}
      <style jsx>{`
        .safe-bottom {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  )
}
