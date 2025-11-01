// src/app/admin/login/page.tsx
// QUAN TRỌNG: File này KHÔNG nằm trong (protected) nên không có layout check auth

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminLoginForm } from '@/components/admin/admin-login-form'

export default async function AdminLoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Nếu đã login
  if (user) {
    // Check xem có phải admin không
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('user_id', user.id)
      .single()

    // Nếu có lỗi query (network, RLS, etc) → Sign out và cho login lại
    if (error) {
      console.error('Error checking admin status:', error)
      await supabase.auth.signOut()
      // KHÔNG redirect, để người dùng thấy trang login với message lỗi
    }
    // Nếu là admin active → redirect dashboard
    else if (adminUser && adminUser.is_active) {
      redirect('/admin/dashboard')
    }
    // Nếu không phải admin hoặc bị inactive → Sign out
    else {
      await supabase.auth.signOut()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-700" />

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Admin Portal
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Đăng nhập để quản lý hệ thống
            </p>
          </div>

          {/* Login Form */}
          <AdminLoginForm />

          {/* Warning */}
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Chỉ dành cho quản trị viên.</strong> Truy cập trái phép sẽ bị ghi nhận.
              </p>
            </div>
          </div>

          {/* Customer Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Bạn là khách hàng?{' '}
              <a href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Đăng nhập tại đây
              </a>
            </p>
          </div>
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
  title: 'Admin Login - Orochi',
  description: 'Admin portal login page',
}