// src/types/roles.types.ts

// ============================================
// PERMISSIONS
// ============================================

export type PermissionKey =
  // Events
  | 'events.view'
  | 'events.create'
  | 'events.update'
  | 'events.delete'
  
  // Tickets
  | 'tickets.view'
  | 'tickets.scan'
  | 'tickets.refund'
  
  // Orders
  | 'orders.view'
  | 'orders.update'
  | 'orders.refund'
  
  // Users
  | 'users.view'
  | 'users.update'
  | 'users.ban'
  | 'users.delete'
  
  // Blog
  | 'blog.view'
  | 'blog.create'
  | 'blog.update'
  | 'blog.delete'
  
  // Vouchers
  | 'vouchers.view'
  | 'vouchers.create'
  | 'vouchers.update'
  | 'vouchers.delete'
  
  // Reports
  | 'reports.view'
  
  // Admin Management
  | 'admins.view'
  | 'admins.create'
  | 'admins.update'
  | 'admins.delete'
  
  // Roles Management
  | 'roles.view'
  | 'roles.create'
  | 'roles.update'
  | 'roles.delete'
  
  // Wildcard (Super Admin)
  | '*'

export type PermissionCategory =
  | 'Events'
  | 'Tickets'
  | 'Orders'
  | 'Users'
  | 'Blog'
  | 'Vouchers'
  | 'Reports'
  | 'Admin Management'
  | 'Roles Management'

export type Permission = {
  id: string
  key: PermissionKey
  display_name: string
  description: string | null
  category: PermissionCategory
  sort_order: number
  created_at: string
}

// ============================================
// ROLES
// ============================================

export type Role = {
  id: string
  name: string
  display_name: string
  description: string | null
  permissions: PermissionKey[]
  is_system_role: boolean
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export type RoleWithStats = Role & {
  admin_count: number // Số admin đang dùng role này
}

// ============================================
// ADMIN USERS
// ============================================

export type AdminUser = {
  id: string
  user_id: string
  role_id: string
  custom_permissions: {
    add?: PermissionKey[]
    remove?: PermissionKey[]
  } | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  notes: string | null
}

export type AdminUserWithDetails = AdminUser & {
  // From auth.users
  email: string
  full_name: string | null
  avatar_url: string | null
  
  // From roles
  role: Role
  
  // Computed
  effective_permissions: PermissionKey[]
}

// ============================================
// ROLE CHANGE LOGS
// ============================================

export type RoleChangeAction =
  | 'role_changed'
  | 'permission_added'
  | 'permission_removed'
  | 'activated'
  | 'deactivated'

export type RoleChangeLog = {
  id: string
  admin_user_id: string
  action: RoleChangeAction
  old_value: any
  new_value: any
  changed_by: string | null
  created_at: string
}

// ============================================
// FORM TYPES
// ============================================

export type CreateRoleInput = {
  name: string
  display_name: string
  description?: string
  permissions: PermissionKey[]
  color?: string
}

export type UpdateRoleInput = Partial<CreateRoleInput> & {
  id: string
}

export type CreateAdminUserInput = {
  email: string
  full_name: string
  role_id: string
  custom_permissions?: {
    add?: PermissionKey[]
    remove?: PermissionKey[]
  }
  notes?: string
}

export type UpdateAdminUserInput = {
  id: string
  role_id?: string
  custom_permissions?: {
    add?: PermissionKey[]
    remove?: PermissionKey[]
  }
  is_active?: boolean
  notes?: string
}

// ============================================
// HELPER TYPES
// ============================================

export type PermissionCheck = {
  hasPermission: boolean
  reason?: string // Why not (for debugging)
}

export type RolePermissions = {
  role: Role
  permissions: Permission[]
  grouped: Record<PermissionCategory, Permission[]>
}