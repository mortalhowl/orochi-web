// src/components/admin/toggle-role-button.tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleRoleStatus } from '@/app/admin/(protected)/roles/actions'

type ToggleRoleButtonProps = {
  roleId: string
  isActive: boolean
  isSystemRole: boolean
}

export function ToggleRoleButton({ roleId, isActive, isSystemRole }: ToggleRoleButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    if (isSystemRole && !isActive) {
      alert('Không thể vô hiệu hóa system role')
      return
    }

    startTransition(async () => {
      try {
        await toggleRoleStatus(roleId, !isActive)
        router.refresh()
      } catch (err: any) {
        alert(err.message || 'Có lỗi xảy ra')
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${
        isActive
          ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
          : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
      }`}
      title={isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
    >
      {isPending ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : isActive ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </button>
  )
}