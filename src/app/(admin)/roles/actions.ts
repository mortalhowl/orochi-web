// src/app/admin/roles/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreateRoleInput, UpdateRoleInput, Role } from '@/types/roles.types'

// ============================================
// PERMISSIONS CHECK
// ============================================

export async function hasPermission(permission: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data, error } = await supabase.rpc('has_permission', {
    p_user_id: user.id,
    p_permission: permission
  })

  return data === true
}

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data } = await supabase.rpc('is_admin', {
    p_user_id: user.id
  })

  return data === true
}

export async function getCurrentAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data } = await supabase
    .from('admin_users')
    .select(`
      *,
      role:roles(*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  return data
}

// ============================================
// ROLES CRUD
// ============================================

export async function getAllRoles() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name')

  if (error) throw error
  return data as Role[]
}

export async function getRoleById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Role
}

export async function createRole(input: CreateRoleInput) {
  // Check permission
  const canCreate = await hasPermission('roles.create')
  if (!canCreate) {
    throw new Error('Bạn không có quyền tạo role mới')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('roles')
    .insert({
      name: input.name,
      display_name: input.display_name,
      description: input.description || null,
      permissions: input.permissions,
      color: input.color || '#64748b',
      is_system_role: false, // User-created roles are never system roles
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/admin/roles')
  return data
}

export async function updateRole(input: UpdateRoleInput) {
  // Check permission
  const canUpdate = await hasPermission('roles.update')
  if (!canUpdate) {
    throw new Error('Bạn không có quyền cập nhật role')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if system role
  const { data: existingRole } = await supabase
    .from('roles')
    .select('is_system_role, name')
    .eq('id', input.id)
    .single()

  if (existingRole?.is_system_role) {
    // System roles: chỉ có thể update permissions và description
    // Không được đổi name, display_name
    const { data, error } = await supabase
      .from('roles')
      .update({
        permissions: input.permissions,
        description: input.description,
        updated_by: user?.id,
      })
      .eq('id', input.id)
      .select()
      .single()

    if (error) throw error
    revalidatePath('/admin/roles')
    return data
  }

  // Non-system roles: có thể update mọi thứ
  const { data, error } = await supabase
    .from('roles')
    .update({
      name: input.name,
      display_name: input.display_name,
      description: input.description,
      permissions: input.permissions,
      color: input.color,
      updated_by: user?.id,
    })
    .eq('id', input.id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/admin/roles')
  return data
}

export async function deleteRole(id: string) {
  // Check permission
  const canDelete = await hasPermission('roles.delete')
  if (!canDelete) {
    throw new Error('Bạn không có quyền xóa role')
  }

  const supabase = await createClient()

  // Check if system role
  const { data: role } = await supabase
    .from('roles')
    .select('is_system_role, name')
    .eq('id', id)
    .single()

  if (role?.is_system_role) {
    throw new Error('Không thể xóa system role')
  }

  // Check if role is being used
  const { count } = await supabase
    .from('admin_users')
    .select('id', { count: 'exact', head: true })
    .eq('role_id', id)

  if (count && count > 0) {
    throw new Error(`Không thể xóa role đang được sử dụng bởi ${count} admin`)
  }

  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/admin/roles')
  return { success: true }
}

export async function toggleRoleStatus(id: string, isActive: boolean) {
  const canUpdate = await hasPermission('roles.update')
  if (!canUpdate) {
    throw new Error('Bạn không có quyền cập nhật role')
  }

  const supabase = await createClient()

  // Don't allow disabling system roles
  const { data: role } = await supabase
    .from('roles')
    .select('is_system_role')
    .eq('id', id)
    .single()

  if (role?.is_system_role && !isActive) {
    throw new Error('Không thể vô hiệu hóa system role')
  }

  const { error } = await supabase
    .from('roles')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/admin/roles')
  return { success: true }
}

// ============================================
// PERMISSIONS CATALOG
// ============================================

export async function getAllPermissions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('permissions_catalog')
    .select('*')
    .order('category')
    .order('sort_order')

  if (error) throw error
  return data
}

export async function getPermissionsByCategory() {
  const permissions = await getAllPermissions()
  
  const grouped = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, typeof permissions>)

  return grouped
}

// ============================================
// ROLE STATS
// ============================================

export async function getRoleStats(roleId: string) {
  const supabase = await createClient()

  // Count admins using this role
  const { count: adminCount } = await supabase
    .from('admin_users')
    .select('id', { count: 'exact', head: true })
    .eq('role_id', roleId)
    .eq('is_active', true)

  return {
    adminCount: adminCount || 0
  }
}