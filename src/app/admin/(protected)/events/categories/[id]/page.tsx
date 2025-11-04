import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, Tag, Calendar, Eye, Palette, List } from 'lucide-react'

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch category details
  const { data: category, error } = await supabase
    .from('event_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !category) {
    notFound()
  }

  // Get events count for this category
  const { count: eventsCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  // Get published events count
  const { count: publishedCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
    .eq('status', 'published')

  // Get recent events with this category
  const { data: recentEvents } = await supabase
    .from('events')
    .select('id, title, slug, status, start_date')
    .eq('category_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          Hoạt động
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
        Không hoạt động
      </span>
    )
  }

  const getEventStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Đã xuất bản
          </span>
        )
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            Nháp
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            Đã hủy
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            Đã kết thúc
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin/events/categories"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">Chi tiết danh mục</h1>
              <p className="text-sm text-slate-600 mt-0.5">{category.name}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(category.is_active)}
              <Link
                href={`/admin/events/categories/${id}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Chỉnh sửa
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 sticky top-6">
              <h2 className="font-semibold text-slate-900 mb-4">Thống kê</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-slate-700">Tổng sự kiện</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">
                    {eventsCount?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-slate-700">Đã xuất bản</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">
                    {publishedCount?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <List className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-slate-700">Thứ tự</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600">
                    {category.sort_order || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-slate-600" />
                Thông tin cơ bản
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Tên danh mục</div>
                    <div className="text-base font-medium text-slate-900">{category.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Slug</div>
                    <div className="text-base font-mono text-slate-900">{category.slug}</div>
                  </div>
                </div>

                {category.description && (
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Mô tả</div>
                    <div className="text-base text-slate-900">{category.description}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.icon && (
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Icon</div>
                      <div className="text-base text-slate-900">{category.icon}</div>
                    </div>
                  )}
                  {category.color && (
                    <div>
                      <div className="text-sm text-slate-600 mb-1 flex items-center gap-1">
                        <Palette className="w-4 h-4" />
                        Màu sắc
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border border-slate-200"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-base font-mono text-slate-900">{category.color}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Ngày tạo</div>
                    <div className="text-base text-slate-900">{formatDate(category.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Cập nhật lần cuối</div>
                    <div className="text-base text-slate-900">{formatDate(category.updated_at)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Events */}
            {recentEvents && recentEvents.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-600" />
                    Sự kiện gần đây
                  </h2>
                  <Link
                    href={`/admin/events?category=${id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Xem tất cả
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="text-sm font-medium text-slate-900 hover:text-blue-600"
                        >
                          {event.title}
                        </Link>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(event.start_date).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      {getEventStatusBadge(event.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!recentEvents || recentEvents.length === 0) && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  Sự kiện
                </h2>
                <div className="text-center py-8 text-slate-500">
                  Chưa có sự kiện nào sử dụng danh mục này
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
