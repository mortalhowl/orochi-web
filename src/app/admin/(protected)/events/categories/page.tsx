import { createClient } from '@/lib/supabase/server'
import { CategoryList } from '@/components/admin/category-list'
import { CategoryFilters } from '@/components/admin/category-filters'
import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'

type SearchParams = Promise<{
  status?: string
  search?: string
  page?: string
}>

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Get filters from search params
  const status = params.status
  const search = params.search
  const page = parseInt(params.page || '1')
  const perPage = 50

  // Build query
  let query = supabase
    .from('event_categories')
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true })

  // Apply filters
  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'inactive') {
    query = query.eq('is_active', false)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Pagination
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  query = query.range(from, to)

  const { data: categories, count, error } = await query

  if (error) {
    console.error('Error fetching categories:', error)
  }

  // Calculate stats
  const { data: allCategories } = await supabase.from('event_categories').select('is_active')

  const totalCategories = allCategories?.length || 0
  const activeCategories = allCategories?.filter((c) => c.is_active).length || 0
  const inactiveCategories = allCategories?.filter((c) => !c.is_active).length || 0

  // Get most used category
  const { data: categoryUsage } = await supabase
    .from('events')
    .select('category_id')
    .not('category_id', 'is', null)

  const categoryCount = categoryUsage?.reduce((acc, event) => {
    acc[event.category_id] = (acc[event.category_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mostUsedCount = categoryCount ? Math.max(...Object.values(categoryCount)) : 0

  const totalPages = count ? Math.ceil(count / perPage) : 1

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý danh mục</h1>
          <p className="text-slate-600 mt-1">Tổng số {count?.toLocaleString() || 0} danh mục</p>
        </div>

        <Link
          href="/admin/events/categories/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tạo danh mục
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Tổng danh mục</div>
          <div className="text-2xl font-bold text-slate-900">{totalCategories.toLocaleString()}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Đang hoạt động</div>
          <div className="text-2xl font-bold text-green-600">{activeCategories.toLocaleString()}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Không hoạt động</div>
          <div className="text-2xl font-bold text-red-600">{inactiveCategories.toLocaleString()}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Sử dụng nhiều nhất</div>
          <div className="text-2xl font-bold text-blue-600">{mostUsedCount.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <CategoryFilters />

      {/* Category List */}
      <Suspense
        fallback={
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4" />
            <p className="text-slate-600">Đang tải...</p>
          </div>
        }
      >
        <CategoryList categories={categories || []} currentPage={page} totalPages={totalPages} />
      </Suspense>
    </div>
  )
}
