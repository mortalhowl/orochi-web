// src/types/database.types.ts

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  total_points: number
  current_points: number
  lifetime_points: number
  rank_id: string | null
  created_at: string
  updated_at: string
}

export type Rank = {
  id: string
  name: string
  display_name: string
  description: string | null
  min_points: number
  max_points: number | null
  point_multiplier: number
  discount_percentage: number
  color: string | null
  icon_url: string | null
  badge_url: string | null
  level: number
  is_active: boolean
  created_at: string
}

export type PointTransactionType = 
  | 'earn' 
  | 'spend' 
  | 'expire' 
  | 'admin_adjust' 
  | 'bonus' 
  | 'refund'

export type PointTransaction = {
  id: string
  user_id: string
  type: PointTransactionType
  points: number
  balance_after: number
  reason: string
  reference_type: string | null
  reference_id: string | null
  created_at: string
  expires_at: string | null
  admin_note: string | null
  created_by: string | null
}

export type VoucherType = 'percentage' | 'fixed' | 'free_shipping' | 'gift'

export type Voucher = {
  id: string
  code: string
  name: string
  description: string | null
  type: VoucherType
  discount_value: number | null
  max_discount: number | null
  min_order_value: number | null
  required_rank_id: string | null
  required_points: number
  max_usage_per_user: number
  max_total_usage: number | null
  current_usage: number
  valid_from: string
  valid_until: string
  is_active: boolean
  is_exclusive: boolean
  created_at: string
  updated_at: string
}

export type UserVoucherStatus = 'available' | 'used' | 'expired' | 'revoked'

export type UserVoucher = {
  id: string
  user_id: string
  voucher_id: string
  status: UserVoucherStatus
  acquired_at: string
  used_at: string | null
  expires_at: string | null
  order_id: string | null
  points_spent: number
  voucher?: Voucher // Join data
}

export type RankHistory = {
  id: string
  user_id: string
  from_rank_id: string | null
  to_rank_id: string
  points_at_change: number
  reason: string | null
  changed_at: string
  from_rank?: Rank // Join data
  to_rank?: Rank // Join data
}

export type PointRuleEventType = 
  | 'purchase'
  | 'review'
  | 'referral'
  | 'birthday'
  | 'sign_up'
  | 'social_share'
  | 'daily_checkin'

export type PointRule = {
  id: string
  name: string
  description: string | null
  event_type: PointRuleEventType
  points_per_action: number
  points_per_currency: number | null
  max_points_per_day: number | null
  max_points_per_user: number | null
  min_order_value: number | null
  applicable_rank_ids: string[] | null
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
}

// Extended types với relationships
export type ProfileWithRank = Profile & {
  rank: Rank | null
}

export type VoucherWithRank = Voucher & {
  required_rank: Rank | null
}

// Helper types cho API responses
export type PointsSummary = {
  total_points: number
  current_points: number
  lifetime_points: number
  rank: Rank | null
  next_rank: Rank | null
  points_to_next_rank: number
}

export type VoucherStats = {
  total_available: number
  used_count: number
  expired_count: number
  total_saved: number
}