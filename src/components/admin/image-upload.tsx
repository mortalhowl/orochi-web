// src/components/admin/image-upload.tsx
'use client'

import { CldUploadWidget } from 'next-cloudinary'
import { useState, useRef } from 'react'
import { uploadWidgetConfig, getThumbnailUrl } from '@/lib/cloudinary'

type ImageUploadProps = {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  folder?: string
  aspectRatio?: number
  label?: string
  description?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  folder = 'events',
  aspectRatio,
  label = 'Upload Image',
  description,
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium">
          {label}
        </label>
      )}
      
      {description && (
        <p className="text-sm text-slate-500">{description}</p>
      )}

      <div className="space-y-4">
        {/* Preview */}
        {value && (
          <div className="relative group">
            <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
              <img
                src={getThumbnailUrl(value) || value}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* View full size */}
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white rounded-lg hover:bg-slate-100 transition-colors"
                  title="Xem ảnh gốc"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </a>

                {/* Remove */}
                {onRemove && !disabled && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    title="Xóa ảnh"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Image URL */}
            <p className="text-xs text-slate-500 mt-1 truncate">{value}</p>
          </div>
        )}

        {/* Upload Button */}
        {!disabled && (
          <CldUploadWidget
            uploadPreset={uploadWidgetConfig.uploadPreset}
            options={{
              ...uploadWidgetConfig,
              folder,
              cropping: aspectRatio ? true : false,
              croppingAspectRatio: aspectRatio || undefined,
              showSkipCropButton: true, // Always allow skip cropping
              croppingShowDimensions: true,
            }}
            onSuccess={(result: any) => {
              setIsUploading(false)
              onChange(result.info.secure_url)
            }}
            onOpen={() => setIsUploading(true)}
            onClose={() => setIsUploading(false)}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                disabled={isUploading}
                className="w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center gap-2">
                  {isUploading ? (
                    <>
                      <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Đang upload...
                      </span>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {value ? 'Thay đổi ảnh' : 'Chọn ảnh để upload'}
                      </span>
                      <span className="text-xs text-slate-500">
                        JPG, PNG, WEBP tối đa 5MB
                      </span>
                    </>
                  )}
                </div>
              </button>
            )}
          </CldUploadWidget>
        )}
      </div>
    </div>
  )
}

// ============================================
// MULTI IMAGE UPLOAD (Gallery)
// ============================================

type GalleryUploadProps = {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  disabled?: boolean
}

export function GalleryUpload({
  value = [],
  onChange,
  maxImages = 10,
  disabled = false,
}: GalleryUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)
  const uploadedUrlsRef = useRef<string[]>([])

  const handleRemove = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newValue = [...value]
    const [removed] = newValue.splice(fromIndex, 1)
    newValue.splice(toIndex, 0, removed)
    onChange(newValue)
  }

  const canAddMore = value.length < maxImages

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Gallery ({value.length}/{maxImages})
      </label>
      <p className="text-sm text-slate-500">
        Upload nhiều ảnh cho gallery. Kéo thả để sắp xếp lại thứ tự.
      </p>

      <div className="space-y-4">
        {/* Gallery Grid */}
        {value.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {value.map((url, index) => (
              <div key={index} className="relative group">
                <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                  <img
                    src={getThumbnailUrl(url) || url}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {/* View */}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-lg hover:bg-slate-100"
                      title="Xem ảnh gốc"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>

                    {/* Remove */}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        title="Xóa ảnh"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Index badge */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {!disabled && canAddMore && (
          <CldUploadWidget
            uploadPreset={uploadWidgetConfig.uploadPreset}
            options={{
              ...uploadWidgetConfig,
              folder: 'events/gallery',
              multiple: true,
              maxFiles: maxImages - value.length,
              cropping: false,
            }}
            onOpen={() => setIsUploading(true)}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => {
                  // Reset ref for new batch
                  uploadedUrlsRef.current = []
                  setUploadCount(0)
                  
                  // Use native Cloudinary widget callback
                  const widget = (window as any).cloudinary?.createUploadWidget(
                    {
                      cloudName: uploadWidgetConfig.cloudName,
                      uploadPreset: uploadWidgetConfig.uploadPreset,
                      folder: 'events/gallery',
                      multiple: true,
                      maxFiles: maxImages - value.length,
                      cropping: false,
                      sources: ['local', 'url', 'camera'],
                      clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
                      maxFileSize: 5000000,
                      styles: uploadWidgetConfig.styles,
                    },
                    (error: any, result: any) => {
                      if (!error && result && result.event === 'success') {
                        // Store in ref (mutable, no re-render)
                        uploadedUrlsRef.current.push(result.info.secure_url)
                        // Update count for UI feedback
                        setUploadCount(uploadedUrlsRef.current.length)
                      }
                      
                      // When widget closes, batch update all at once
                      if (result && result.event === 'close') {
                        setIsUploading(false)
                        
                        // Batch update: add all collected URLs at once
                        if (uploadedUrlsRef.current.length > 0) {
                          onChange([...value, ...uploadedUrlsRef.current])
                          uploadedUrlsRef.current = []
                          setUploadCount(0)
                        }
                      }
                    }
                  )
                  
                  if (widget) {
                    setIsUploading(true)
                    widget.open()
                  } else {
                    // Fallback to open prop
                    open()
                  }
                }}
                disabled={isUploading}
                className="w-full px-4 py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-blue-500 transition-colors disabled:opacity-50"
              >
                <div className="flex flex-col items-center gap-2">
                  {isUploading ? (
                    <>
                      <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm">
                        Đang upload... {uploadCount > 0 && `(${uploadCount} ảnh)`}
                      </span>
                    </>
                  ) : (
                    <>
                      <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm font-medium">Thêm ảnh vào gallery</span>
                      <span className="text-xs text-slate-500">
                        Còn có thể thêm {maxImages - value.length} ảnh
                      </span>
                    </>
                  )}
                </div>
              </button>
            )}
          </CldUploadWidget>
        )}

        {!canAddMore && (
          <p className="text-sm text-amber-600">
            Đã đạt giới hạn {maxImages} ảnh
          </p>
        )}
      </div>
    </div>
  )
}