// src/components/header.tsx
"use client"

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { signOut } from '@/app/auth/actions'
import { AvatarWithRank } from '../auth/avatar-with-rank'
import { ThemeToggle } from '../shared/theme-toggle'
import Link from 'next/link'

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

type HeaderProps = {
  user: User
  profile?: Profile
}

export function Header({ user, profile }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="font-bold text-xl">Orochi</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Trang chủ
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

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Points display */}
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

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
              >
                <AvatarWithRank 
                  user={user} 
                  profile={profile}
                  size="md"
                  showBadge={!!profile?.rank}
                />
              </button>

              {/* Dropdown menu */}
              {isMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  
                  {/* Menu */}
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
                      
                      {/* Rank & Points */}
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
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Thông tin cá nhân
                      </Link>
                      
                      <Link
                        href="/points"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Điểm thưởng
                      </Link>

                      <Link
                        href="/vouchers"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        Voucher của tôi
                      </Link>

                      <div className="my-2 border-t border-border" />

                      <form action={signOut}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Đăng xuất
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}