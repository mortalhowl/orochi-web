// src/components/layout/public-mobile-menu.tsx
'use client'

import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { signOut } from '@/app/auth/actions'

type PublicMobileMenuProps = {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

export function PublicMobileMenu({ isOpen, onClose, user }: PublicMobileMenuProps) {
  return (
    <div
      className={`
        fixed top-16 left-0 right-0 bottom-0 bg-background 
        md:hidden
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        z-50 // <-- THAY ĐỔI TỪ z-30 LÊN z-50
      `}
    >
      <div className="flex flex-col h-full p-6 space-y-4">
        {/* Navigation Links */}
        <Link href="/" onClick={onClose} className="text-lg font-medium py-2">
          Trang chủ
        </Link>
        <Link href="/events" onClick={onClose} className="text-lg font-medium py-2">
          Sự kiện
        </Link>
        <Link href="/points" onClick={onClose} className="text-lg font-medium py-2">
          Điểm thưởng
        </Link>
        <Link href="/vouchers" onClick={onClose} className="text-lg font-medium py-2">
          Voucher
        </Link>

        {/* Divider */}
        <div className="flex-1" />
        <div className="border-t border-border" />

        {/* Auth Buttons */}
        {user ? (
          <>
            <Link
              href="/profile"
              onClick={onClose}
              className="block w-full text-center px-4 py-3 text-lg font-medium bg-primary text-primary-foreground rounded-lg"
            >
              Xem hồ sơ
            </Link>
            <form action={signOut} className="w-full">
              <button
                type="submit"
                className="block w-full text-center px-4 py-3 text-lg font-medium text-destructive"
              >
                Đăng xuất
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/login"
            onClick={onClose}
            className="block w-full text-center px-4 py-3 text-lg font-medium bg-primary text-primary-foreground rounded-lg"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </div>
  )
}