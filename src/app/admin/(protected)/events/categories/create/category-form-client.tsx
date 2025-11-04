'use client'

import { useRouter } from 'next/navigation'
import { CategoryForm } from '@/components/admin/category-form'
import type { CategoryFormData } from '@/components/admin/category-form'
import { createCategory } from '../actions'

export function CategoryFormClient() {
  const router = useRouter()

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      const category = await createCategory(data)
      router.push(`/admin/events/categories/${category.id}`)
      router.refresh()
    } catch (error: any) {
      throw new Error(error.message || 'Có lỗi xảy ra khi tạo danh mục')
    }
  }

  return <CategoryForm onSubmit={handleSubmit} mode="create" />
}
