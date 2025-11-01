// src/app/admin/roles/create/page.tsx
import { redirect } from 'next/navigation'
import { hasPermission, getPermissionsByCategory } from '@/app/admin/(protected)/roles/actions'
import { RoleForm } from '@/components/admin/role-form'

export default async function CreateRolePage() {
  // Check permission
  const canCreate = await hasPermission('roles.create')
  if (!canCreate) {
    redirect('/admin/roles')
  }

  // Get all permissions grouped by category
  const permissionsByCategory = await getPermissionsByCategory()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
        <a href="/admin/roles" className="hover:text-slate-900 dark:hover:text-white">
          Quản lý vai trò
        </a>
        <span>›</span>
        <span className="text-slate-900 dark:text-white font-medium">Tạo role mới</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tạo role mới</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Tạo vai trò mới và cấu hình quyền hạn
        </p>
      </div>

      {/* Form */}
      <RoleForm permissionsByCategory={permissionsByCategory} />
    </div>
  )
}