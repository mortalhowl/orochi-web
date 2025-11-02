// src/app/(public)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { PublicLayoutClient } from '@/components/layout/public-layout-client'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        rank:ranks!profiles_rank_id_fkey(*)
      `)
      .eq('id', user.id)
      .single()
    profile = data
  }

  // Giống như admin layout, chuyển toàn bộ data và children
  // cho một component Client để quản lý UI
  return (
    <PublicLayoutClient user={user} profile={profile}>
      {children}
    </PublicLayoutClient>
  )
}