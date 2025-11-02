// src/app/admin/(protected)/events/page.tsx
import { redirect } from 'next/navigation'
import { hasPermission } from '@/app/admin/(protected)/roles/actions'
import { getAllEvents, getEventStats, getEventCategories } from './actions'
import Link from 'next/link'
import { EventsTable } from '@/components/admin/events-table'
import { EventsFilters } from '@/components/admin/events-filters'

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Check permission
  const canView = await hasPermission('events.view')
  if (!canView) {
    redirect('/admin/dashboard')
  }

  const canCreate = await hasPermission('events.create')

  // Parse search params
  const params = await searchParams
  const status = params.status as string | undefined
  const category = params.category as string | undefined
  const search = params.search as string | undefined

  // Fetch data
  const [events, stats, categories] = await Promise.all([
    getAllEvents({
      status: status as any,
      category_id: category,
      search,
    }),
    getEventStats(),
    getEventCategories(),
  ])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">Quản lý sự kiện</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Tạo và quản lý các sự kiện của bạn
            </p>
          </div>
          {canCreate && (
            <Link
              href="/admin/events/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo sự kiện mới
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tổng sự kiện</p>
          <p className="text-3xl font-bold">{stats.total_events}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Đã xuất bản</p>
          <p className="text-3xl font-bold text-green-600">{stats.published_events}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Vé đã bán</p>
          <p className="text-3xl font-bold text-purple-600">{stats.total_tickets_sold}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Sắp diễn ra</p>
          <p className="text-3xl font-bold text-amber-600">{stats.upcoming_events}</p>
        </div>
      </div>

      {/* Filters */}
      <EventsFilters categories={categories} />

      {/* Events Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <EventsTable events={events} />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Quản lý sự kiện - Admin Portal',
  description: 'Manage all events',
}