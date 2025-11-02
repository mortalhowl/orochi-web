// src/components/public/events-filters-public.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { EventCategory } from '@/types/events.types'
import { useState } from 'react'

type EventsFiltersPublicProps = {
  categories: EventCategory[]
}

export function EventsFiltersPublic({ categories }: EventsFiltersPublicProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')

  const currentCategory = searchParams.get('category') || ''
  const currentSort = searchParams.get('sort') || 'upcoming'

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    // Reset to page 1 when filters change
    params.delete('page')

    router.push(`/events?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter('search', searchInput)
  }

  const clearFilters = () => {
    setSearchInput('')
    router.push('/events')
  }

  const hasActiveFilters = currentCategory || searchInput || currentSort !== 'upcoming'

  return (
    <div className="mb-8">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm sự kiện..."
            className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => updateFilter('category', '')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !currentCategory
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-600'
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => updateFilter('category', cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentCategory === cat.id
                ? 'text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
            style={{
              backgroundColor: currentCategory === cat.id ? cat.color : undefined,
              borderColor: currentCategory === cat.id ? cat.color : undefined,
            }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Sort & Clear */}
      <div className="flex items-center justify-between">
        <select
          value={currentSort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="upcoming">Sắp diễn ra</option>
          <option value="newest">Mới nhất</option>
          <option value="popular">Phổ biến nhất</option>
        </select>

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