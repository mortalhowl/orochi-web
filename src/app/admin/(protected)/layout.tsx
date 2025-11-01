// src/app/(admin)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { checkIsAdmin, getCurrentAdmin } from '@/app/admin/(protected)/auth/actions'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { AdminHeader } from '@/components/layout/admin-header'
import { AdminLayoutClient } from '@/components/layout/admin-layout-client'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is logged in
  if (!user) {
    redirect('/admin/login')
  }

  // Check if user is admin
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) {
    redirect('/')
  }

  // Get admin info
  const adminUser = await getCurrentAdmin()

  return (
    <AdminLayoutClient user={user} adminUser={adminUser}>
      {children}
    </AdminLayoutClient>
  )
}

export const metadata = {
  title: 'Admin Portal - Orochi',
  description: 'Admin management portal',
}