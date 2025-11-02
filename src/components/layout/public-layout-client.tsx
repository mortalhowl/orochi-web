// src/components/layout/public-layout-client.tsx
'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { PublicHeader } from './public-header'
import { PublicMobileMenu } from './public-mobile-menu'
import { PublicFooter } from './public-footer'

// Tái sử dụng các types bạn đã định nghĩa (hoặc import từ types.ts)
type Rank = {
  name: string
  display_name: string
  color: string
  level: number
}
type Profile = {
  total_points: number
  current_points: number
  rank: Rank | null
}

type PublicLayoutClientProps = {
  user: User | null
  profile: Profile | null
  children: React.ReactNode
}

export function PublicLayoutClient({ user, profile, children }: PublicLayoutClientProps) {
  // 1. State quản lý menu di động, giống hệt 'mobileMenuOpen' trong AdminLayoutClient
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleToggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleCloseMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 2. Header: Truyền user, profile và hàm toggle */}
      <PublicHeader
        user={user}
        profile={profile}
        isMobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={handleToggleMobileMenu}
      />

      {/* 3. Mobile Menu (Overlay): Tương tự 'Sidebar - Mobile' của admin */}
      <PublicMobileMenu
        isOpen={mobileMenuOpen}
        onClose={handleCloseMobileMenu}
        user={user}
      />

      {/* 4. Nội dung trang (children) */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* 5. Footer */}
      <PublicFooter />

      {/* 6. Mobile backdrop: Giống hệt admin layout */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleCloseMobileMenu}
        />
      )}
    </div>
  )
}