'use client'

import { useRouter } from 'next/navigation'
import { CategoryForm } from '@/components/admin/category-form'
import type { CategoryFormData } from '@/components/admin/category-form'
import type { EventCategory } from '@/types/events.types'
import { updateCategory } from '../../actions'

type CategoryFormClientProps = {
  category: EventCategory
}

export function CategoryFormClient({ category }: CategoryFormClientProps) {
  const router = useRouter()

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      await updateCategory(category.id, data)
      router.push(`/admin/events/categories/${category.id}`)
      router.refresh()
    } catch (error: any) {
      throw new Error(error.message || 'Có lỗi xảy ra khi cập nhật danh mục')
    }
  }

  return <CategoryForm category={category} onSubmit={handleSubmit} mode="edit" />
}
