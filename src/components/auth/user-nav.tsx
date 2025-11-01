// ============================================
// src/components/user-nav.tsx (For logged in user)
// ============================================
"use client"

import { signOut } from '@/app/auth/actions'
import { User } from '@supabase/supabase-js'
import { useState } from 'react'

export function UserNav({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-border p-1 hover:bg-accent transition-colors"
      >
        {user.user_metadata.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata.full_name || 'User'}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            {user.email?.[0].toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-popover shadow-lg z-50">
            <div className="p-4 border-b border-border">
              <p className="font-medium">{user.user_metadata.full_name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="p-2">
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}