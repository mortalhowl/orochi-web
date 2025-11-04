'use client'

import { useRouter } from 'next/navigation'
import { UserForm } from '@/components/admin/user-form'
import type { UserFormData } from '@/components/admin/user-form'
import { updateUser } from '../../actions'

type Rank = {
  id: string
  name: string
  color: string
  min_points: number
}

type UserProfile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  total_points: number
  current_points: number
  lifetime_points: number
  rank_id: string | null
}

type UserFormClientProps = {
  user: UserProfile
  ranks: Rank[]
}

export function UserFormClient({ user, ranks }: UserFormClientProps) {
  const router = useRouter()

  const handleSubmit = async (data: UserFormData) => {
    try {
      await updateUser(user.id, data)
      router.push(`/admin/users/${user.id}`)
      router.refresh()
    } catch (error: any) {
      throw new Error(error.message || 'Có lỗi xảy ra khi cập nhật người dùng')
    }
  }

  return <UserForm user={user} ranks={ranks} onSubmit={handleSubmit} />
}
