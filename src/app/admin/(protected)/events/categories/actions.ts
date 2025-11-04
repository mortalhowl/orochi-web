'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EventCategory } from '@/types/events.types'
import type { CategoryFormData } from '@/components/admin/category-form'

// ============================================
// CREATE CATEGORY
// ============================================

export async function createCategory(input: CategoryFormData): Promise<EventCategory> {
  const supabase = await createClient()

  // Check if slug already exists
  const { data: existing } = await supabase
    .from('event_categories')
    .select('id')
    .eq('slug', input.slug)
    .single()

  if (existing) {
    throw new Error('Slug đã tồn tại. Vui lòng sử dụng slug khác.')
  }

  // Create category
  const { data, error } = await supabase
    .from('event_categories')
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      icon: input.icon || null,
      color: input.color || null,
      sort_order: input.sort_order || 0,
      is_active: input.is_active,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    throw new Error('Không thể tạo danh mục. Vui lòng thử lại.')
  }

  revalidatePath('/admin/events/categories')
  revalidatePath('/admin/events')

  return data as EventCategory
}

// ============================================
// UPDATE CATEGORY
// ============================================

export async function updateCategory(
  id: string,
  input: CategoryFormData
): Promise<EventCategory> {
  const supabase = await createClient()

  // Check if slug already exists (excluding current category)
  const { data: existing } = await supabase
    .from('event_categories')
    .select('id')
    .eq('slug', input.slug)
    .neq('id', id)
    .single()

  if (existing) {
    throw new Error('Slug đã tồn tại. Vui lòng sử dụng slug khác.')
  }

  // Update category
  const { data, error } = await supabase
    .from('event_categories')
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      icon: input.icon || null,
      color: input.color || null,
      sort_order: input.sort_order || 0,
      is_active: input.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating category:', error)
    throw new Error('Không thể cập nhật danh mục. Vui lòng thử lại.')
  }

  revalidatePath('/admin/events/categories')
  revalidatePath(`/admin/events/categories/${id}`)
  revalidatePath('/admin/events')

  return data as EventCategory
}

// ============================================
// DELETE CATEGORY
// ============================================

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient()

  // Check if category is being used by any events
  const { count } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if (count && count > 0) {
    throw new Error(
      `Không thể xóa danh mục này vì đang có ${count} sự kiện sử dụng. Vui lòng chuyển các sự kiện sang danh mục khác trước.`
    )
  }

  // Delete category
  const { error } = await supabase.from('event_categories').delete().eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    throw new Error('Không thể xóa danh mục. Vui lòng thử lại.')
  }

  revalidatePath('/admin/events/categories')
  revalidatePath('/admin/events')
}

// ============================================
// TOGGLE CATEGORY STATUS
// ============================================

export async function toggleCategoryStatus(id: string, isActive: boolean): Promise<EventCategory> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_categories')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error toggling category status:', error)
    throw new Error('Không thể thay đổi trạng thái danh mục. Vui lòng thử lại.')
  }

  revalidatePath('/admin/events/categories')
  revalidatePath(`/admin/events/categories/${id}`)
  revalidatePath('/admin/events')

  return data as EventCategory
}
