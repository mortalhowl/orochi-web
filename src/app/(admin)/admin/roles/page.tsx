// src/app/admin/roles/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasPermission, getAllRoles, getRoleStats } from './actions'
import Link from 'next/link'
import { RoleCard } from '@/components/admin/role-card'
import { DeleteRoleButton } from '@/components/admin/delete-role-button'
import { ToggleRoleButton } from '@/components/admin/toggle-role-button'

export default async function RolesPage() {
  // Check permission
  const canView = await hasPermission('roles.view')
  if (!canView) {
    redirect('/admin/dashboard')
  }

  const canCreate = await hasPermission('roles.create')
  const canUpdate = await hasPermission('roles.update')
  const canDelete = await hasPermission('roles.delete')

  // Fetch roles
  const roles = await getAllRoles()

  // Get stats for each role
  const rolesWithStats = await Promise.all(
    roles.map(async (role) => {
      const stats = await getRoleStats(role.id)
      return { ...role, adminCount: stats.adminCount }
    })
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">Quản lý vai trò</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Quản lý các vai trò và quyền hạn trong hệ thống
            </p>
          </div>
          {canCreate && (
            <Link
              href="/admin/roles/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo role mới
            </Link>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tổng số roles</div>
          <div className="text-2xl font-bold">{roles.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">System roles</div>
          <div className="text-2xl font-bold">{roles.filter(r => r.is_system_role).length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Custom roles</div>
          <div className="text-2xl font-bold">{roles.filter(r => !r.is_system_role).length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Active roles</div>
          <div className="text-2xl font-bold text-green-600">{roles.filter(r => r.is_active).length}</div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rolesWithStats.map((role) => (
          <div
            key={role.id}
            className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <h3 className="font-semibold text-lg">{role.display_name}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {role.description || 'Không có mô tả'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {role.is_system_role && (
                    <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                      System Role
                    </span>
                  )}
                  {!role.is_active && (
                    <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                      Không hoạt động
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Số admin sử dụng:</span>
                <span className="font-semibold">{role.adminCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-600 dark:text-slate-400">Số quyền:</span>
                <span className="font-semibold">
                  {role.permissions.includes('*') ? 'Toàn quyền' : role.permissions.length}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/roles/${role.id}`}
                className="flex-1 px-3 py-2 text-sm text-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Xem chi tiết
              </Link>
              
              {canUpdate && (
                <Link
                  href={`/admin/roles/${role.id}/edit`}
                  className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Sửa
                </Link>
              )}

              {canUpdate && (
                <ToggleRoleButton
                  roleId={role.id}
                  isActive={role.is_active}
                  isSystemRole={role.is_system_role}
                />
              )}

              {canDelete && !role.is_system_role && role.adminCount === 0 && (
                <DeleteRoleButton roleId={role.id} roleName={role.display_name} />
              )}
            </div>

            {/* Warning if has admins */}
            {role.adminCount > 0 && !role.is_system_role && (
              <div className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Không thể xóa role đang được sử dụng
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {roles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎭</div>
          <h3 className="text-xl font-semibold mb-2">Chưa có role nào</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Tạo role đầu tiên để bắt đầu phân quyền
          </p>
          {canCreate && (
            <Link
              href="/admin/roles/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo role mới
            </Link>
          )}
        </div>
      )}
    </div>
  )
}