// src/app/points/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================
// Lấy thông tin điểm và rank của user
// ============================================
export async function getUserPointsSummary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      rank:ranks!profiles_rank_id_fkey(*)
    `)
    .eq('id', user.id)
    .single()

  if (error) throw error

  // Tìm rank tiếp theo
  const { data: nextRank } = await supabase
    .from('ranks')
    .select('*')
    .gt('min_points', profile.total_points)
    .eq('is_active', true)
    .order('min_points', { ascending: true })
    .limit(1)
    .single()

  return {
    total_points: profile.total_points,
    current_points: profile.current_points,
    lifetime_points: profile.lifetime_points,
    rank: profile.rank,
    next_rank: nextRank,
    points_to_next_rank: nextRank ? nextRank.min_points - profile.total_points : 0,
  }
}

// ============================================
// Thêm điểm cho user (internal use)
// ============================================
export async function addPoints(
  userId: string,
  points: number,
  reason: string,
  referenceType?: string,
  referenceId?: string
) {
  const supabase = await createClient()

  // Bắt đầu transaction
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('total_points, current_points')
    .eq('id', userId)
    .single()

  if (profileError) throw profileError

  const newTotalPoints = profile.total_points + points
  const newCurrentPoints = profile.current_points + points

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      total_points: newTotalPoints,
      current_points: newCurrentPoints,
      lifetime_points: () => `lifetime_points + ${points}`,
    })
    .eq('id', userId)

  if (updateError) throw updateError

  // Ghi transaction history
  const { error: txError } = await supabase
    .from('point_transactions')
    .insert({
      user_id: userId,
      type: 'earn',
      points: points,
      balance_after: newCurrentPoints,
      reason: reason,
      reference_type: referenceType,
      reference_id: referenceId,
    })

  if (txError) throw txError

  revalidatePath('/profile')
  return { success: true, new_balance: newCurrentPoints }
}

// ============================================
// Trừ điểm (dùng để đổi voucher)
// ============================================
export async function spendPoints(
  points: number,
  reason: string,
  referenceType?: string,
  referenceId?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_points')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError

  if (profile.current_points < points) {
    throw new Error('Insufficient points')
  }

  const newCurrentPoints = profile.current_points - points

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      current_points: newCurrentPoints,
    })
    .eq('id', user.id)

  if (updateError) throw updateError

  // Ghi transaction
  const { error: txError } = await supabase
    .from('point_transactions')
    .insert({
      user_id: user.id,
      type: 'spend',
      points: -points,
      balance_after: newCurrentPoints,
      reason: reason,
      reference_type: referenceType,
      reference_id: referenceId,
    })

  if (txError) throw txError

  revalidatePath('/profile')
  return { success: true, new_balance: newCurrentPoints }
}

// ============================================
// Lấy lịch sử giao dịch điểm
// ============================================
export async function getPointTransactions(limit = 20, offset = 0) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('point_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

// ============================================
// Đổi voucher bằng điểm
// ============================================
export async function redeemVoucher(voucherId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  // Lấy thông tin voucher
  const { data: voucher, error: voucherError } = await supabase
    .from('vouchers')
    .select(`
      *,
      required_rank:ranks!vouchers_required_rank_id_fkey(*)
    `)
    .eq('id', voucherId)
    .single()

  if (voucherError) throw voucherError

  // Check voucher còn active không
  if (!voucher.is_active) {
    throw new Error('Voucher is not active')
  }

  // Check thời gian
  const now = new Date()
  if (now < new Date(voucher.valid_from) || now > new Date(voucher.valid_until)) {
    throw new Error('Voucher is expired or not yet valid')
  }

  // Lấy thông tin user
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, rank:ranks!profiles_rank_id_fkey(*)')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError

  // Check điểm đủ không
  if (profile.current_points < voucher.required_points) {
    throw new Error('Insufficient points')
  }

  // Check rank đủ không
  if (voucher.required_rank_id && (!profile.rank || profile.rank.level < voucher.required_rank.level)) {
    throw new Error('Your rank is not high enough')
  }

  // Check đã dùng voucher này bao nhiêu lần
  const { count } = await supabase
    .from('user_vouchers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('voucher_id', voucherId)

  if (count && count >= voucher.max_usage_per_user) {
    throw new Error('You have reached the maximum usage limit for this voucher')
  }

  // Check total usage
  if (voucher.max_total_usage && voucher.current_usage >= voucher.max_total_usage) {
    throw new Error('This voucher has been fully redeemed')
  }

  // Trừ điểm
  await spendPoints(
    voucher.required_points,
    `Redeemed voucher: ${voucher.code}`,
    'voucher',
    voucherId
  )

  // Thêm voucher cho user
  const { data: userVoucher, error: userVoucherError } = await supabase
    .from('user_vouchers')
    .insert({
      user_id: user.id,
      voucher_id: voucherId,
      status: 'available',
      points_spent: voucher.required_points,
      expires_at: voucher.valid_until,
    })
    .select()
    .single()

  if (userVoucherError) throw userVoucherError

  // Tăng current_usage của voucher
  await supabase
    .from('vouchers')
    .update({ current_usage: voucher.current_usage + 1 })
    .eq('id', voucherId)

  revalidatePath('/vouchers')
  return { success: true, voucher: userVoucher }
}

// ============================================
// Lấy voucher khả dụng cho user
// ============================================
export async function getAvailableVouchers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, rank:ranks!profiles_rank_id_fkey(*)')
    .eq('id', user.id)
    .single()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      *,
      required_rank:ranks!vouchers_required_rank_id_fkey(*)
    `)
    .eq('is_active', true)
    .lte('valid_from', now)
    .gte('valid_until', now)
    .order('required_points', { ascending: true })

  if (error) throw error

  // Filter vouchers mà user đủ điều kiện
  const availableVouchers = data.filter(voucher => {
    // Check rank
    if (voucher.required_rank_id && (!profile?.rank || profile.rank.level < voucher.required_rank.level)) {
      return false
    }
    // Check points
    if (profile && profile.current_points < voucher.required_points) {
      return false
    }
    return true
  })

  return availableVouchers
}

// ============================================
// Lấy voucher của user
// ============================================
export async function getUserVouchers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('user_vouchers')
    .select(`
      *,
      voucher:vouchers(*)
    `)
    .eq('user_id', user.id)
    .order('acquired_at', { ascending: false })

  if (error) throw error
  return data
}