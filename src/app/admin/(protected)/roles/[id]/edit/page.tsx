// src/app/admin/(protected)/roles/[id]/edit/page.tsx
import { redirect, notFound } from 'next/navigation'
import { hasPermission, getRoleById, getPermissionsByCategory } from '../../actions'
import { RoleForm } from '@/components/admin/role-form'

// ✅ FIX: params giờ là Promise
export default async function EditRolePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // ✅ PHẢI await params trước!
  const { id } = await params

  // Check permission
  const canUpdate = await hasPermission('roles.update')
  if (!canUpdate) {
    redirect('/admin/roles')
  }

  // Get role
  let role
  try {
    role = await getRoleById(id)
  } catch (error) {
    notFound()
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
        <a 
          href={`/admin/roles/${id}`}
          className="hover:text-slate-900 dark:hover:text-white"
        >
          {role.display_name}
        </a>
        <span>›</span>
        <span className="text-slate-900 dark:text-white font-medium">Chỉnh sửa</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Chỉnh sửa role</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Cập nhật thông tin và quyền hạn của role
        </p>
        {role.is_system_role && (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <strong>System Role:</strong> Chỉ có thể chỉnh sửa quyền hạn và mô tả. 
                Không thể thay đổi tên và màu sắc.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      <RoleForm 
        role={role} 
        permissionsByCategory={permissionsByCategory}
        isSystemRole={role.is_system_role}
      />
    </div>
  )
}