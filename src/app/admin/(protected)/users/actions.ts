'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserFormData } from '@/components/admin/user-form'

// ============================================
// UPDATE USER
// ============================================

export async function updateUser(userId: string, input: UserFormData): Promise<void> {
  const supabase = await createClient()

  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.full_name || null,
      phone: input.phone || null,
      avatar_url: input.avatar_url || null,
      rank_id: input.rank_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user:', error)
    throw new Error('Không thể cập nhật người dùng. Vui lòng thử lại.')
  }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
}

// ============================================
// ADD POINTS TO USER
// ============================================

export async function addPointsToUser(
  userId: string,
  points: number,
  reason: string
): Promise<void> {
  const supabase = await createClient()

  // Call database function
  const { error } = await supabase.rpc('add_test_points', {
    p_user_id: userId,
    p_points: points,
    p_reason: reason,
  })

  if (error) {
    console.error('Error adding points:', error)
    throw new Error('Không thể thêm điểm. Vui lòng thử lại.')
  }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
}

// ============================================
// DEDUCT POINTS FROM USER
// ============================================

export async function deductPointsFromUser(
  userId: string,
  points: number,
  reason: string
): Promise<void> {
  const supabase = await createClient()

  // Get current points
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_points')
    .eq('id', userId)
    .single()

  if (!profile) {
    throw new Error('Không tìm thấy người dùng')
  }

  if (profile.current_points < points) {
    throw new Error('Điểm hiện tại không đủ để trừ')
  }

  const newBalance = profile.current_points - points

  // Update profile
  await supabase
    .from('profiles')
    .update({
      current_points: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  // Create transaction record
  await supabase.from('point_transactions').insert({
    user_id: userId,
    type: 'redeem',
    points: -points,
    balance_after: newBalance,
    reason: reason,
    reference_type: 'manual',
  })

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
}
