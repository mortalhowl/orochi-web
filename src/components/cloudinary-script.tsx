// src/components/cloudinary-script.tsx
'use client'

import { useEffect } from 'react'

export function CloudinaryScript() {
  useEffect(() => {
    // Load Cloudinary widget script if not already loaded
    if (!(window as any).cloudinary) {
      const script = document.createElement('script')
      script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  return null
}