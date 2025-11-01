// src/app/admin/reset-password/page.tsx
import { ResetPasswordForm } from '@/components/admin/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-700" />

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
          {/* Icon & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Đặt lại mật khẩu
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Nhập mật khẩu mới cho tài khoản admin của bạn
            </p>
          </div>

          {/* Form */}
          <ResetPasswordForm />
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-slate-400">
          © 2025 Orochi. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Đặt lại mật khẩu - Admin Portal',
  description: 'Reset your admin password',
}