// src/components/admin/role-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createRole, updateRole } from '@/app/(admin)/admin/roles/actions'
import type { Role, PermissionKey } from '@/types/roles.types'

type RoleFormProps = {
  role?: Role
  permissionsByCategory: Record<string, any[]>
  isSystemRole?: boolean
}

const COLORS = [
  { value: '#ef4444', label: 'Đỏ' },
  { value: '#f59e0b', label: 'Cam' },
  { value: '#10b981', label: 'Xanh lá' },
  { value: '#3b82f6', label: 'Xanh dương' },
  { value: '#8b5cf6', label: 'Tím' },
  { value: '#ec4899', label: 'Hồng' },
  { value: '#64748b', label: 'Xám' },
]

export function RoleForm({ role, permissionsByCategory, isSystemRole = false }: RoleFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: role?.name || '',
    display_name: role?.display_name || '',
    description: role?.description || '',
    color: role?.color || '#3b82f6',
    permissions: role?.permissions || [],
  })

  const [selectedPermissions, setSelectedPermissions] = useState<Set<PermissionKey>>(
    new Set(role?.permissions || [])
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const permissions = Array.from(selectedPermissions)

        if (role) {
          // Update
          await updateRole({
            id: role.id,
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description,
            color: formData.color,
            permissions,
          })
        } else {
          // Create
          await createRole({
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description,
            color: formData.color,
            permissions,
          })
        }

        router.push('/admin/roles')
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra')
      }
    })
  }

  const togglePermission = (permission: PermissionKey) => {
    const newPermissions = new Set(selectedPermissions)
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission)
    } else {
      newPermissions.add(permission)
    }
    setSelectedPermissions(newPermissions)
  }

  const toggleCategory = (categoryPermissions: string[]) => {
    const allSelected = categoryPermissions.every(p => selectedPermissions.has(p as PermissionKey))
    const newPermissions = new Set(selectedPermissions)
    
    if (allSelected) {
      // Unselect all
      categoryPermissions.forEach(p => newPermissions.delete(p as PermissionKey))
    } else {
      // Select all
      categoryPermissions.forEach(p => newPermissions.add(p as PermissionKey))
    }
    
    setSelectedPermissions(newPermissions)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-200">Lỗi</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
        
        <div className="space-y-4">
          {/* Name (slug) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tên role (slug) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSystemRole}
              placeholder="content_manager"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Chỉ dùng chữ thường, số và dấu gạch dưới. VD: content_manager
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tên hiển thị <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              disabled={isSystemRole}
              placeholder="Quản lý nội dung"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả vai trò và trách nhiệm..."
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Màu badge</label>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  disabled={isSystemRole}
                  className={`w-10 h-10 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.color === color.value
                      ? 'border-slate-900 dark:border-white scale-110'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-semibold mb-4">
          Quyền hạn <span className="text-sm font-normal text-slate-500">({selectedPermissions.size} đã chọn)</span>
        </h2>

        <div className="space-y-4">
          {Object.entries(permissionsByCategory).map(([category, permissions]) => {
            const categoryPermissions = permissions.map(p => p.key)
            const allSelected = categoryPermissions.every(p => selectedPermissions.has(p))
            const someSelected = categoryPermissions.some(p => selectedPermissions.has(p))

            return (
              <div key={category} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => toggleCategory(categoryPermissions)}
                      className="w-5 h-5 rounded border-slate-300"
                    />
                    <span className="font-semibold">{category}</span>
                    <span className="text-xs text-slate-500">
                      ({categoryPermissions.filter(p => selectedPermissions.has(p)).length}/{categoryPermissions.length})
                    </span>
                  </label>
                </div>

                {/* Permissions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-7">
                  {permissions.map((permission) => (
                    <label
                      key={permission.key}
                      className="flex items-start gap-2 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.has(permission.key)}
                        onChange={() => togglePermission(permission.key)}
                        className="w-4 h-4 rounded border-slate-300 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{permission.display_name}</div>
                        {permission.description && (
                          <div className="text-xs text-slate-500">{permission.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {selectedPermissions.size === 0 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
            ⚠️ Chưa chọn quyền nào. Role này sẽ không có quyền truy cập.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isPending || selectedPermissions.size === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {role ? 'Cập nhật role' : 'Tạo role'}
        </button>
      </div>
    </form>
  )
}