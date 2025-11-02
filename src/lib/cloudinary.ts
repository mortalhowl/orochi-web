// src/lib/cloudinary.ts

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'orochi_events',
}

// ============================================
// UPLOAD WIDGET CONFIG
// ============================================

export const uploadWidgetConfig = {
  cloudName: CLOUDINARY_CONFIG.cloudName,
  uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
  folder: 'events',
  sources: ['local', 'url', 'camera'] as ("local" | "url" | "camera" | "dropbox" | "facebook" | "gettyimages" | "google_drive" | "image_search" | "instagram" | "istock" | "shutterstock" | "unsplash")[],
  multiple: false,
  maxFiles: 1,
  maxFileSize: 5000000, // 5MB
  clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
  resourceType: 'image' as const,
  cropping: false, // Disable default cropping to prevent crashes
  showSkipCropButton: true,
  styles: {
    palette: {
      window: '#FFFFFF',
      windowBorder: '#E5E7EB',
      tabIcon: '#3B82F6',
      menuIcons: '#6B7280',
      textDark: '#1F2937',
      textLight: '#FFFFFF',
      link: '#3B82F6',
      action: '#3B82F6',
      inactiveTabIcon: '#9CA3AF',
      error: '#EF4444',
      inProgress: '#F59E0B',
      complete: '#10B981',
      sourceBg: '#F9FAFB',
    },
  },
}

// Gallery upload (multiple images)
export const galleryUploadConfig = {
  ...uploadWidgetConfig,
  multiple: true,
  maxFiles: 10,
  cropping: false, // No cropping for gallery
}

// Banner upload (wider aspect ratio)
export const bannerUploadConfig = {
  ...uploadWidgetConfig,
  cropping: true,
  croppingAspectRatio: 21 / 9, // Ultra-wide
  showSkipCropButton: true, // Allow skip
  folder: 'events/banners',
}

// Featured image (square-ish)
export const featuredImageConfig = {
  ...uploadWidgetConfig,
  cropping: true,
  croppingAspectRatio: 4 / 3,
  showSkipCropButton: true, // Allow skip
  folder: 'events/featured',
}

// ============================================
// IMAGE TRANSFORMATION HELPERS
// ============================================

/**
 * Generate Cloudinary transformation URL
 * @param url - Original Cloudinary URL
 * @param transformations - Array of transformation strings
 * @returns Transformed URL
 */
export function getTransformedUrl(
  url: string | null | undefined,
  transformations: string[]
): string | null {
  if (!url || !url.includes('cloudinary.com')) return url || null

  const parts = url.split('/upload/')
  if (parts.length !== 2) return url

  const [base, path] = parts
  const transformString = transformations.join(',')

  return `${base}/upload/${transformString}/${path}`
}

/**
 * Get thumbnail URL (small, optimized)
 */
export function getThumbnailUrl(url: string | null | undefined): string | null {
  return getTransformedUrl(url, [
    'w_300',
    'h_200',
    'c_fill',
    'q_auto',
    'f_auto',
  ])
}

/**
 * Get card image URL (medium size for cards)
 */
export function getCardImageUrl(url: string | null | undefined): string | null {
  return getTransformedUrl(url, [
    'w_600',
    'h_400',
    'c_fill',
    'q_auto',
    'f_auto',
  ])
}

/**
 * Get hero/banner URL (large, high quality)
 */
export function getHeroImageUrl(url: string | null | undefined): string | null {
  return getTransformedUrl(url, [
    'w_1920',
    'h_800',
    'c_fill',
    'q_auto',
    'f_auto',
  ])
}

/**
 * Get optimized URL with custom dimensions
 */
export function getOptimizedUrl(
  url: string | null | undefined,
  width: number,
  height?: number,
  options?: {
    crop?: 'fill' | 'fit' | 'scale' | 'crop'
    gravity?: 'auto' | 'face' | 'center'
    quality?: 'auto' | number
  }
): string | null {
  const transformations = [
    `w_${width}`,
    height ? `h_${height}` : null,
    `c_${options?.crop || 'fill'}`,
    options?.gravity ? `g_${options.gravity}` : null,
    `q_${options?.quality || 'auto'}`,
    'f_auto',
  ].filter(Boolean) as string[]

  return getTransformedUrl(url, transformations)
}

/**
 * Get responsive srcset for <img>
 */
export function getResponsiveSrcSet(
  url: string | null | undefined,
  baseWidth: number = 600
): string | null {
  if (!url) return null

  const widths = [baseWidth, baseWidth * 1.5, baseWidth * 2]
  const srcset = widths
    .map((width) => {
      const transformed = getOptimizedUrl(url, Math.round(width))
      return `${transformed} ${width}w`
    })
    .join(', ')

  return srcset
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Check if URL is a valid Cloudinary URL
 */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com')
}

/**
 * Extract public ID from Cloudinary URL
 */
export function getPublicId(url: string | null | undefined): string | null {
  if (!url || !isCloudinaryUrl(url)) return null

  try {
    const parts = url.split('/upload/')
    if (parts.length !== 2) return null

    const pathParts = parts[1].split('/')
    // Remove transformation parameters if any
    const withoutTransform = pathParts.filter(part => !part.startsWith('w_') && !part.startsWith('h_'))
    
    // Get filename without extension
    const filename = withoutTransform[withoutTransform.length - 1]
    const publicId = filename.split('.')[0]

    return publicId
  } catch {
    return null
  }
}

// ============================================
// DELETE HELPER (Server-side only)
// ============================================

/**
 * Delete image from Cloudinary
 * NOTE: This should be called from server actions only
 */
export async function deleteCloudinaryImage(url: string): Promise<boolean> {
  const publicId = getPublicId(url)
  if (!publicId) return false

  try {
    // Call your server action to delete
    // This requires CLOUDINARY_API_SECRET which should NEVER be exposed to client
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    })

    return response.ok
  } catch (error) {
    console.error('Failed to delete Cloudinary image:', error)
    return false
  }
}

// ============================================
// PLACEHOLDER/FALLBACK IMAGES
// ============================================

export const PLACEHOLDER_IMAGES = {
  event: 'https://placehold.co/600x400/3b82f6/ffffff?text=Event',
  banner: 'https://placehold.co/1920x800/8b5cf6/ffffff?text=Banner',
  avatar: 'https://placehold.co/200x200/10b981/ffffff?text=User',
}

/**
 * Get image URL with fallback
 */
export function getImageUrlWithFallback(
  url: string | null | undefined,
  type: keyof typeof PLACEHOLDER_IMAGES = 'event'
): string {
  return url || PLACEHOLDER_IMAGES[type]
}