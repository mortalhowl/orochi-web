// src/app/admin/auth/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

// ============================================
// ADMIN SIGN IN (Email/Password)
// ============================================
export async function signInAdmin(email: string, password: string) {
  const supabase = await createClient()

  // Sign in with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    // Common error messages
    if (authError.message.includes('Invalid login credentials')) {
      return { error: 'Email hoặc mật khẩu không đúng' }
    }
    if (authError.message.includes('Email not confirmed')) {
      return { error: 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư của bạn.' }
    }
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Đăng nhập thất bại' }
  }

  // Check if user is admin
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select(`
      id,
      is_active,
      role:roles(
        id,
        name,
        display_name,
        permissions
      )
    `)
    .eq('user_id', authData.user.id)
    .single()

  if (adminError || !adminUser) {
    // User exists but is not an admin - sign out
    await supabase.auth.signOut()
    return { 
      error: 'Tài khoản này không có quyền truy cập Admin Portal. Vui lòng liên hệ quản trị viên.' 
    }
  }

  if (!adminUser.is_active) {
    // Admin account is disabled
    await supabase.auth.signOut()
    return { 
      error: 'Tài khoản admin của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên cấp cao.' 
    }
  }

  // Success
  revalidatePath('/admin', 'layout')
  return { 
    success: true, 
    user: authData.user,
    adminUser 
  }
}

// ============================================
// ADMIN SIGN OUT
// ============================================
export async function signOutAdmin() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin', 'layout')
  return { success: true }
}

// ============================================
// FORGOT PASSWORD (Send reset email)
// ============================================
export async function sendPasswordResetEmail(email: string) {
  const supabase = await createClient()

  // Check if email exists in admin_users
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (!profile) {
    // Don't reveal if email exists or not (security)
    return { 
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu.'
    }
  }

  // Check if user is admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', profile.id)
    .single()

  if (!adminUser) {
    // Not an admin, but don't reveal
    return { 
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu.'
    }
  }

  // Send reset password email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { 
    success: true,
    message: 'Email hướng dẫn đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.'
  }
}

// ============================================
// RESET PASSWORD (With token from email)
// ============================================
export async function resetPassword(password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: error.message }
  }

  return { 
    success: true,
    message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay bây giờ.'
  }
}

// ============================================
// GET CURRENT ADMIN USER
// ============================================
export async function getCurrentAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select(`
      *,
      role:roles(*),
      profile:profiles(*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  return adminUser
}

// ============================================
// CHECK IF USER IS ADMIN
// ============================================
export async function checkIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  return !!adminUser
}