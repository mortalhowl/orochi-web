// src/components/layout/public-header.tsx
'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { signOut } from '@/app/auth/actions'
import { AvatarWithRank } from '../auth/avatar-with-rank'
import { ThemeToggle } from '../shared/theme-toggle'
import Link from 'next/link'

// Các types này nên được chuyển vào file @/types/database.types.ts
// hoặc @/types/events.types.ts để dùng chung
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

// Props của Header, được cập nhật để nhận state/function từ layout client
type HeaderProps = {
  user: User | null // User có thể là null nếu chưa đăng nhập
  profile?: Profile | null // Profile cũng có thể là null
  isMobileMenuOpen: boolean // State của menu mobile (từ component cha)
  onMobileMenuToggle: () => void // Hàm để bật/tắt menu mobile (từ component cha)
}

export function PublicHeader({
  user,
  profile,
  isMobileMenuOpen,
  onMobileMenuToggle,
}: HeaderProps) {
  // State này chỉ dùng cho dropdown profile trên desktop
  const [isUserMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/100 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="font-bold text-xl">Orochi</span>
          </Link>

          {/* Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              href="/events"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Sự kiện
            </Link>
            <Link
              href="/points"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Điểm thưởng
            </Link>
            <Link
              href="/vouchers"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Voucher
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center gap-2">
            {/* Points display (chỉ hiện khi đã login) */}
            {profile && (
              <Link
                href="/points"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 rounded-full transition-colors"
              >
                <svg
                  className="w-4 h-4 text-amber-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-500">
                  {profile.current_points.toLocaleString()}
                </span>
              </Link>
            )}

            {/* Theme toggle */}
            <ThemeToggle />

            {/* User menu (Desktop) hoặc Nút Login (Desktop) */}
            {user ? (
              // Nếu đã login: Hiển thị Avatar (chỉ trên desktop)
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen(!isUserMenuOpen)}
                  className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
                >
                  <AvatarWithRank
                    user={user}
                    profile={profile}
                    size="md"
                    showBadge={!!profile?.rank}
                  />
                </button>

                {/* Dropdown menu (Desktop) */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 rounded-lg border border-border bg-popover shadow-lg z-50 overflow-hidden">
                      {/* User info */}
                      <div className="p-4 border-b border-border bg-gradient-to-br from-background to-muted">
                        <div className="flex items-center gap-3 mb-3">
                          <AvatarWithRank
                            user={user}
                            profile={profile}
                            size="lg"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {user.user_metadata.full_name || 'User'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        {profile && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: profile.rank?.color || '#9CA3AF' }}
                              />
                              <span className="font-medium">
                                {profile.rank?.display_name || 'Thành viên'}
                              </span>
                            </div>
                            <span className="font-semibold text-amber-600">
                              {profile.current_points.toLocaleString()} điểm
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Menu items */}
                      <div className="p-2">
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                        >
                          {/* ... (SVG icon) ... */}
                          Thông tin cá nhân
                        </Link>
                        {/* ... (các Link khác) ... */}
                        <div className="my-2 border-t border-border" />
                        <form action={signOut}>
                          <button
                            type="submit"
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                          >
                            {/* ... (SVG icon) ... */}
                            Đăng xuất
                          </button>
                        </form>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Nếu chưa login: Hiển thị Nút Đăng nhập (chỉ trên desktop)
              <Link
                href="/login"
                className="hidden md:flex items-center justify-center px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
              >
                Đăng nhập
              </Link>
            )}

            {/* Nút Hamburger (Mobile) */}
            {/* Giống hệt pattern của AdminHeader */}
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? (
                // Icon X
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Icon Hamburger
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}