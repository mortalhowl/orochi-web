// src/app/admin/(protected)/events/[id]/edit/page.tsx
import { redirect, notFound } from 'next/navigation'
import { hasPermission } from '@/app/admin/(protected)/roles/actions'
import { getEventById, getEventCategories } from '../../actions'
import { EventForm } from '@/components/admin/event-form'

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Await params
  const { id } = await params

  // Check permission
  const canUpdate = await hasPermission('events.update')
  if (!canUpdate) {
    redirect('/admin/events')
  }

  // Fetch event and categories
  let event
  try {
    event = await getEventById(id)
  } catch (error) {
    console.error('[EditEventPage] Error:', error)
    notFound()
  }

  const categories = await getEventCategories()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
        <a href="/admin/events" className="hover:text-slate-900 dark:hover:text-white">
          Quản lý sự kiện
        </a>
        <span>›</span>
        <a
          href={`/admin/events/${id}`}
          className="hover:text-slate-900 dark:hover:text-white"
        >
          {event.title}
        </a>
        <span>›</span>
        <span className="text-slate-900 dark:text-white font-medium">Chỉnh sửa</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Chỉnh sửa sự kiện</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Cập nhật thông tin sự kiện
        </p>
      </div>

      {/* Form */}
      <EventForm mode="edit" event={event} categories={categories} />
    </div>
  )
}

export const metadata = {
  title: 'Chỉnh sửa sự kiện - Admin Portal',
  description: 'Edit event',
}