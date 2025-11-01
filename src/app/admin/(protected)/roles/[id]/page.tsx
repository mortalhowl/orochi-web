// src/app/admin/(protected)/roles/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { hasPermission, getRoleById, getRoleStats, getAllPermissions } from '../actions'
import Link from 'next/link'
import { DeleteRoleButton } from '@/components/admin/delete-role-button'
import { ToggleRoleButton } from '@/components/admin/toggle-role-button'

// ✅ FIX: params giờ là Promise
export default async function RoleDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // ✅ PHẢI await params trước!
  const { id } = await params

  // Check permission
  const canView = await hasPermission('roles.view')
  if (!canView) {
    redirect('/admin/roles')
  }

  const canUpdate = await hasPermission('roles.update')
  const canDelete = await hasPermission('roles.delete')

  // Get role
  let role
  try {
    role = await getRoleById(id)
  } catch (error) {
    notFound()
  }

  // Get stats
  const stats = await getRoleStats(id)

  // Get all permissions for display
  const allPermissions = await getAllPermissions()
  const permissionsMap = Object.fromEntries(
    allPermissions.map(p => [p.key, p])
  )

  // Group role permissions by category
  const groupedPermissions = role.permissions
    .filter(key => key !== '*')
    .map(key => permissionsMap[key])
    .filter(Boolean)
    .reduce<Record<string, typeof allPermissions[number][]>>((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    }, {})

  const isSuperAdmin = role.permissions.includes('*')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
        <Link href="/admin/roles" className="hover:text-slate-900 dark:hover:text-white">
          Quản lý vai trò
        </Link>
        <span>›</span>
        <span className="text-slate-900 dark:text-white font-medium">{role.display_name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: role.color }}
            />
            <h1 className="text-3xl font-bold">{role.display_name}</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-3">
            {role.description || 'Không có mô tả'}
          </p>
          <div className="flex items-center gap-2">
            {role.is_system_role && (
              <span className="px-3 py-1 text-sm font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                System Role
              </span>
            )}
            {!role.is_active && (
              <span className="px-3 py-1 text-sm font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                Không hoạt động
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canUpdate && (
            <>
              <Link
                href={`/admin/roles/${id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Chỉnh sửa
              </Link>
              <ToggleRoleButton
                roleId={role.id}
                isActive={role.is_active}
                isSystemRole={role.is_system_role}
              />
            </>
          )}
          {canDelete && !role.is_system_role && stats.adminCount === 0 && (
            <DeleteRoleButton roleId={role.id} roleName={role.display_name} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Số admin sử dụng</div>
          <div className="text-2xl font-bold">{stats.adminCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Số quyền</div>
          <div className="text-2xl font-bold">
            {isSuperAdmin ? '∞' : role.permissions.length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Trạng thái</div>
          <div className={`text-2xl font-bold ${role.is_active ? 'text-green-600' : 'text-red-600'}`}>
            {role.is_active ? 'Hoạt động' : 'Đã tắt'}
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-xl font-semibold mb-4">Quyền hạn</h2>

        {isSuperAdmin ? (
          <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
            <div className="text-4xl mb-3">👑</div>
            <h3 className="text-lg font-semibold mb-2">Toàn quyền</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Role này có quyền truy cập vào tất cả các tính năng của hệ thống
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([category, permissions]) => (
              <div key={category} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  {category}
                  <span className="text-xs text-slate-500 font-normal">
                    ({permissions.length})
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissions.map((permission) => (
                    <div
                      key={permission.key}
                      className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded"
                    >
                      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium">{permission.display_name}</div>
                        {permission.description && (
                          <div className="text-xs text-slate-500">{permission.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {role.permissions.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                Role này chưa có quyền nào
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warning */}
      {stats.adminCount > 0 && !role.is_system_role && (
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              Role này đang được sử dụng bởi <strong>{stats.adminCount} admin</strong>. 
              Không thể xóa cho đến khi không còn admin nào sử dụng.
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Tên role (slug):</span> {role.name}
          </div>
          <div>
            <span className="font-medium">Màu:</span> 
            <span className="inline-flex items-center gap-1 ml-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
              {role.color}
            </span>
          </div>
          <div>
            <span className="font-medium">Ngày tạo:</span> {new Date(role.created_at).toLocaleDateString('vi-VN')}
          </div>
          <div>
            <span className="font-medium">Cập nhật lần cuối:</span> {new Date(role.updated_at).toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>
    </div>
  )
}