// src/app/(public)/events/page.tsx
import { getPublicEvents, getPublicCategories } from './actions'
import { EventCard } from '@/components/public/event-card'
import { EventsFiltersPublic } from '@/components/public/events-filters-public'
import { Pagination } from '@/components/public/pagination'

export default async function PublicEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  
  const page = parseInt(params.page as string) || 1
  const sort = (params.sort as any) || 'upcoming'
  const category = params.category as string
  const search = params.search as string

  const [{ events, total, totalPages }, categories] = await Promise.all([
    getPublicEvents({ category_id: category, search }, sort, page, 12),
    getPublicCategories(),
  ])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Khám phá sự kiện
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Tham gia các sự kiện thú vị, kết nối cộng đồng và trải nghiệm điều mới mẻ
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <EventsFiltersPublic categories={categories} />

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-slate-600 dark:text-slate-400">
            Tìm thấy <span className="font-semibold text-slate-900 dark:text-white">{total}</span> sự kiện
          </p>
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/events"
              />
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Không tìm thấy sự kiện nào</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác
            </p>
            <a
              href="/events"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Xem tất cả sự kiện
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Khám phá sự kiện - Orochi Platform',
  description: 'Browse and discover exciting events',
}