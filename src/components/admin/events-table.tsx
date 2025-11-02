// src/components/admin/events-table.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { EventWithDetails } from '@/types/events.types'
import { changeEventStatus, deleteEvent, duplicateEvent, toggleEventFeatured } from '@/app/admin/(protected)/events/actions'
import { getCardImageUrl } from '@/lib/cloudinary'

type EventsTableProps = {
  events: EventWithDetails[]
}

export function EventsTable({ events }: EventsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleStatusChange = (eventId: string, newStatus: any) => {
    startTransition(async () => {
      try {
        await changeEventStatus(eventId, newStatus)
        router.refresh()
      } catch (err: any) {
        alert(err.message || 'Có lỗi xảy ra')
      }
    })
  }

  const handleToggleFeatured = (eventId: string, isFeatured: boolean) => {
    startTransition(async () => {
      try {
        await toggleEventFeatured(eventId, !isFeatured)
        router.refresh()
      } catch (err: any) {
        alert(err.message || 'Có lỗi xảy ra')
      }
    })
  }

  const handleDuplicate = (eventId: string) => {
    startTransition(async () => {
      try {
        const newEvent = await duplicateEvent(eventId)
        router.push(`/admin/events/${newEvent.id}/edit`)
        router.refresh()
      } catch (err: any) {
        alert(err.message || 'Có lỗi xảy ra')
      }
    })
  }

  const handleDelete = (eventId: string) => {
    startTransition(async () => {
      try {
        await deleteEvent(eventId)
        setDeleteConfirm(null)
        router.refresh()
      } catch (err: any) {
        alert(err.message || 'Có lỗi xảy ra')
      }
    })
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

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold mb-2">Chưa có sự kiện nào</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Tạo sự kiện đầu tiên của bạn
        </p>
        <Link
          href="/admin/events/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo sự kiện mới
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Sự kiện</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Danh mục</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Ngày diễn ra</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Vé</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {/* Event Info */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                    {event.featured_image ? (
                      <img
                        src={getCardImageUrl(event.featured_image) || event.featured_image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Title & Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="font-semibold hover:text-blue-600 transition-colors truncate"
                      >
                        {event.title}
                      </Link>
                      {event.is_featured && (
                        <span className="flex-shrink-0 text-amber-500" title="Sự kiện nổi bật">
                          ⭐
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {event.description || 'Chưa có mô tả'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {event.views_count} lượt xem
                    </p>
                  </div>
                </div>
              </td>

              {/* Category */}
              <td className="px-4 py-3">
                {event.category ? (
                  <span
                    className="inline-block px-2 py-1 text-xs font-semibold rounded-full"
                    style={{
                      backgroundColor: `${event.category.color}20`,
                      color: event.category.color,
                    }}
                  >
                    {event.category.icon} {event.category.name}
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm">-</span>
                )}
              </td>

              {/* Date */}
              <td className="px-4 py-3">
                <div className="text-sm">
                  <p className="font-medium">
                    {new Date(event.start_date).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {new Date(event.start_date).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </td>

              {/* Tickets */}
              <td className="px-4 py-3">
                <div className="text-sm">
                  <p className="font-medium">
                    {event.current_attendees} / {event.max_attendees || '∞'}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {event.ticket_types?.length || 0} loại vé
                  </p>
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                  {getStatusLabel(event.status)}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {/* View */}
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Xem chi tiết"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>

                  {/* Edit */}
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>

                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicate(event.id)}
                    disabled={isPending}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    title="Nhân bản"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteConfirm(event.id)}
                    disabled={isPending}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                    title="Xóa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-2">Xác nhận xóa sự kiện</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Bạn có chắc chắn muốn xóa sự kiện này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isPending}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Đang xóa...' : 'Xóa sự kiện'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}