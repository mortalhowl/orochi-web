'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Filter } from 'lucide-react'

type TicketFiltersProps = {
  events: Array<{ id: string; title: string }>
}

export function TicketFilters({ events }: TicketFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [eventId, setEventId] = useState(searchParams.get('event') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (eventId) params.set('event', eventId)
    if (status) params.set('status', status)

    startTransition(() => {
      // Use replace to avoid adding to history and prevent layout re-render
      router.replace(`/admin/tickets?${params.toString()}`, { scroll: false })
    })
  }

  const handleReset = () => {
    setSearch('')
    setEventId('')
    setStatus('')

    startTransition(() => {
      router.replace('/admin/tickets', { scroll: false })
    })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-5 h-5 text-slate-600" />
        <h2 className="font-semibold text-slate-900">Bộ lọc</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tìm kiếm</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mã vé, tên, email..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Event Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sự kiện</label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả sự kiện</option>
            {events?.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="active">Chưa dùng</option>
            <option value="used">Đã check-in</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {/* Submit */}
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Đang lọc...' : 'Lọc'}
          </button>
          {(search || eventId || status) && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isPending}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Xóa
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
