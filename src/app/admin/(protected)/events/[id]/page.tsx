// src/app/admin/(protected)/events/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { hasPermission } from '@/app/admin/(protected)/roles/actions'
import { getEventById } from '../actions'
import Link from 'next/link'
import { getCardImageUrl, getHeroImageUrl } from '@/lib/cloudinary'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Await params
  const { id } = await params

  // Check permission
  const canView = await hasPermission('events.view')
  if (!canView) {
    redirect('/admin/events')
  }

  const canUpdate = await hasPermission('events.update')

  // Fetch event
  let event
  try {
    event = await getEventById(id)
  } catch (error) {
    console.error('[EventDetailPage] Error:', error)
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'draft':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'completed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Đã xuất bản'
      case 'draft': return 'Nháp'
      case 'cancelled': return 'Đã hủy'
      case 'completed': return 'Đã kết thúc'
      default: return status
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
        <Link href="/admin/events" className="hover:text-slate-900 dark:hover:text-white">
          Quản lý sự kiện
        </Link>
        <span>›</span>
        <span className="text-slate-900 dark:text-white font-medium">{event.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{event.title}</h1>
            {event.is_featured && (
              <span className="text-2xl" title="Sự kiện nổi bật">⭐</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(event.status)}`}>
              {getStatusLabel(event.status)}
            </span>
            {event.category && (
              <span
                className="inline-block px-3 py-1 text-sm font-semibold rounded-full"
                style={{
                  backgroundColor: `${event.category.color}20`,
                  color: event.category.color,
                }}
              >
                {event.category.icon} {event.category.name}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {canUpdate && (
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/events/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Chỉnh sửa
            </Link>
            <Link
              href={`/events/${event.slug}`}
              target="_blank"
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Xem trang công khai
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Lượt xem</div>
          <div className="text-2xl font-bold">{event.views_count}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Đã đăng ký</div>
          <div className="text-2xl font-bold text-green-600">
            {event.current_attendees} / {event.max_attendees || '∞'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Loại vé</div>
          <div className="text-2xl font-bold">{event.ticket_types?.length || 0}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Ngày diễn ra</div>
          <div className="text-lg font-bold">
            {new Date(event.start_date).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Hình ảnh</h2>
            
            {/* Featured Image */}
            {event.featured_image && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Ảnh đại diện</p>
                <img
                  src={getCardImageUrl(event.featured_image) || event.featured_image}
                  alt={event.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Banner */}
            {event.banner_image && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Banner</p>
                <img
                  src={getHeroImageUrl(event.banner_image) || event.banner_image}
                  alt={`${event.title} banner`}
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Gallery */}
            {event.gallery && event.gallery.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Gallery ({event.gallery.length})</p>
                <div className="grid grid-cols-3 gap-2">
                  {event.gallery.map((url, index) => (
                    <img
                      key={index}
                      src={getCardImageUrl(url) || url}
                      alt={`Gallery ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-semibold mb-3">Mô tả</h2>
              <p className="text-slate-600 dark:text-slate-400">{event.description}</p>
            </div>
          )}

          {/* Content */}
          {event.content && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-semibold mb-3">Nội dung chi tiết</h2>
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: event.content }}
              />
            </div>
          )}

          {/* Ticket Types */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Loại vé</h2>
            {event.ticket_types && event.ticket_types.length > 0 ? (
              <div className="space-y-3">
                {event.ticket_types.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{ticket.name}</h3>
                        {ticket.description && (
                          <p className="text-sm text-slate-500">{ticket.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">
                          {ticket.price.toLocaleString('vi-VN')}đ
                        </p>
                        <p className="text-sm text-slate-500">
                          {ticket.sold_count}/{ticket.quantity} đã bán
                        </p>
                      </div>
                    </div>

                    {ticket.benefits && ticket.benefits.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Quyền lợi:</p>
                        <ul className="space-y-1">
                          {ticket.benefits.map((benefit, index) => (
                            <li key={index} className="text-sm flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {ticket.points_earned > 0 && (
                      <p className="text-sm text-amber-600 mt-2">
                        🎁 Tặng {ticket.points_earned} điểm thưởng
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Chưa có loại vé nào</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400">Slug</p>
                <p className="font-medium">{event.slug}</p>
              </div>

              <div>
                <p className="text-slate-600 dark:text-slate-400">Ngày bắt đầu</p>
                <p className="font-medium">
                  {new Date(event.start_date).toLocaleString('vi-VN')}
                </p>
              </div>

              <div>
                <p className="text-slate-600 dark:text-slate-400">Ngày kết thúc</p>
                <p className="font-medium">
                  {new Date(event.end_date).toLocaleString('vi-VN')}
                </p>
              </div>

              {event.registration_start && (
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Bắt đầu đăng ký</p>
                  <p className="font-medium">
                    {new Date(event.registration_start).toLocaleString('vi-VN')}
                  </p>
                </div>
              )}

              {event.registration_end && (
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Kết thúc đăng ký</p>
                  <p className="font-medium">
                    {new Date(event.registration_end).toLocaleString('vi-VN')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {(event.location_name || event.location_address) && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-semibold mb-4">Địa điểm</h2>
              <div className="space-y-2 text-sm">
                {event.location_name && (
                  <p className="font-medium">{event.location_name}</p>
                )}
                {event.location_address && (
                  <p className="text-slate-600 dark:text-slate-400">{event.location_address}</p>
                )}
              </div>

              {event.location_map_url && (
                <div className="mt-4 aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={event.location_map_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Metadata</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400">Tạo bởi</p>
                <p className="font-medium">
                  {event.creator?.full_name || event.creator?.email || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-slate-600 dark:text-slate-400">Ngày tạo</p>
                <p className="font-medium">
                  {new Date(event.created_at).toLocaleString('vi-VN')}
                </p>
              </div>

              <div>
                <p className="text-slate-600 dark:text-slate-400">Cập nhật lần cuối</p>
                <p className="font-medium">
                  {new Date(event.updated_at).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}