// src/components/admin/events-filters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { EventCategory } from '@/types/events.types'

type EventsFiltersProps = {
  categories: EventCategory[]
}

export function EventsFilters({ categories }: EventsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get('status') || ''
  const currentCategory = searchParams.get('category') || ''
  const currentSearch = searchParams.get('search') || ''

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`/admin/events?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/admin/events')
  }

  const hasActiveFilters = currentStatus || currentCategory || currentSearch

  return (
    <div className="mb-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            value={currentSearch}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={currentStatus}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Nháp</option>
          <option value="published">Đã xuất bản</option>
          <option value="completed">Đã kết thúc</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        {/* Category Filter */}
        <select
          value={currentCategory}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  )
}