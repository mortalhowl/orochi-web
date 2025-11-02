// src/app/admin/(protected)/events/create/page.tsx
import { redirect } from 'next/navigation'
import { hasPermission } from '@/app/admin/(protected)/roles/actions'
import { getEventCategories } from '../actions'
import { EventForm } from '@/components/admin/event-form'

export default async function CreateEventPage() {
  // Check permission
  const canCreate = await hasPermission('events.create')
  if (!canCreate) {
    redirect('/admin/events')
  }

  // Fetch categories
  const categories = await getEventCategories()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
        <a href="/admin/events" className="hover:text-slate-900 dark:hover:text-white">
          Quản lý sự kiện
        </a>
        <span>›</span>
        <span className="text-slate-900 dark:text-white font-medium">Tạo sự kiện mới</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tạo sự kiện mới</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Điền đầy đủ thông tin để tạo một sự kiện mới
        </p>
      </div>

      {/* Form */}
      <EventForm mode="create" categories={categories} />
    </div>
  )
}

export const metadata = {
  title: 'Tạo sự kiện mới - Admin Portal',
  description: 'Create a new event',
}