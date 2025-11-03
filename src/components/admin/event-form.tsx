// src/components/admin/event-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent, updateEvent, generateEventSlug } from '@/app/admin/(protected)/events/actions'
import { ImageUpload, GalleryUpload } from './image-upload'
import { RichTextEditor } from './rich-text-editor'
import { TicketTypesEditor } from './ticket-types-editor'
import { generateSlug } from '@/lib/slug'
import type { Event, EventCategory, CreateEventInput, UpdateEventInput, EventWithTickets } from '@/types/events.types'

type EventFormProps = {
  event?: EventWithTickets
  categories: EventCategory[]
  mode: 'create' | 'edit'
}

export function EventForm({ event, categories, mode }: EventFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'media' | 'location' | 'tickets' | 'seo'>('basic')

  // Helper: Convert UTC ISO string to local datetime-local format
  const toLocalDatetime = (isoString?: string) => {
    if (!isoString) return ''
    // Remove 'Z' and milliseconds to get format: YYYY-MM-DDTHH:mm
    const date = new Date(isoString)
    const offset = date.getTimezoneOffset() * 60000
    const localDate = new Date(date.getTime() - offset)
    return localDate.toISOString().slice(0, 16)
  }

  // Helper: Auto-generate meta if empty
  const generateMeta = (title: string, description?: string) => {
    return {
      meta_title: title.slice(0, 60), // SEO best practice: 50-60 chars
      meta_description: description?.slice(0, 160) || title.slice(0, 160), // 150-160 chars
    }
  }

  // Form state
  const [formData, setFormData] = useState<CreateEventInput>(() => {
    const meta = event?.meta_title && event?.meta_description
      ? { meta_title: event.meta_title, meta_description: event.meta_description }
      : generateMeta(event?.title || '', event?.description)

    return {
      title: event?.title || '',
      slug: event?.slug || '',
      description: event?.description || '',
      content: event?.content || '',
      featured_image: event?.featured_image || undefined,
      banner_image: event?.banner_image || undefined,
      gallery: event?.gallery || [],
      category_id: event?.category_id || undefined,
      location_name: event?.location_name || undefined,
      location_address: event?.location_address || undefined,
      location_map_url: event?.location_map_url || undefined,
      start_date: toLocalDatetime(event?.start_date),
      end_date: toLocalDatetime(event?.end_date),
      registration_start: toLocalDatetime(event?.registration_start),
      registration_end: toLocalDatetime(event?.registration_end),
      max_attendees: event?.max_attendees || undefined,
      status: event?.status || 'draft',
      is_featured: event?.is_featured || false,
      meta_title: meta.meta_title,
      meta_description: meta.meta_description,
      // Load ticket_types from event in edit mode
      ticket_types: event?.ticket_types?.map((tt) => ({
        name: tt.name,
        description: tt.description || undefined,
        price: tt.price,
        quantity: tt.quantity,
        sale_start: tt.sale_start || undefined,
        sale_end: tt.sale_end || undefined,
        benefits: tt.benefits || [],
        points_earned: tt.points_earned,
        sort_order: tt.sort_order,
        is_active: tt.is_active,
      })) || [],
    }
  })

  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false)

  const handleTitleChange = (title: string) => {
    setFormData(prev => {
      const updates: any = { title }

      // Auto-generate slug only in create mode
      if (mode === 'create' && !prev.slug) {
        updates.slug = generateSlug(title)
      }

      // Auto-generate meta if empty or in create mode
      if (mode === 'create' || !prev.meta_title) {
        const meta = generateMeta(title, prev.description)
        updates.meta_title = meta.meta_title
        updates.meta_description = meta.meta_description
      }

      return { ...prev, ...updates }
    })
  }

  const handleGenerateSlug = async () => {
    if (!formData.title) {
      alert('Vui lòng nhập tiêu đề trước')
      return
    }

    setIsGeneratingSlug(true)
    try {
      const newSlug = await generateEventSlug(formData.title)
      setFormData(prev => ({ ...prev, slug: newSlug }))
    } catch (err: any) {
      alert(err.message || 'Có lỗi khi tạo slug')
    } finally {
      setIsGeneratingSlug(false)
    }
  }

  // Helper: Convert local datetime to UTC ISO string
  const toUTCISOString = (localDatetime: string) => {
    if (!localDatetime) return undefined
    return new Date(localDatetime).toISOString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề sự kiện')
      return
    }

    if (!formData.slug.trim()) {
      setError('Vui lòng nhập slug')
      return
    }

    if (!formData.start_date) {
      setError('Vui lòng chọn ngày bắt đầu')
      return
    }

    if (!formData.end_date) {
      setError('Vui lòng chọn ngày kết thúc')
      return
    }

    if (formData.ticket_types.length === 0) {
      setError('Vui lòng thêm ít nhất 1 loại vé')
      return
    }

    startTransition(async () => {
      try {
        // Convert local datetime to UTC before sending to server
        const dataToSubmit = {
          ...formData,
          start_date: toUTCISOString(formData.start_date)!,
          end_date: toUTCISOString(formData.end_date)!,
          registration_start: toUTCISOString(formData.registration_start || ''),
          registration_end: toUTCISOString(formData.registration_end || ''),
        }

        if (mode === 'create') {
          const newEvent = await createEvent(dataToSubmit)
          router.push(`/admin/events/${newEvent.id}`)
        } else {
          await updateEvent({ id: event!.id, ...dataToSubmit })
          router.push(`/admin/events/${event!.id}`)
        }
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra')
      }
    })
  }

  const tabs = [
    { id: 'basic', label: 'Thông tin cơ bản', icon: '📝' },
    { id: 'content', label: 'Nội dung', icon: '📄' },
    { id: 'media', label: 'Hình ảnh', icon: '🖼️' },
    { id: 'location', label: 'Địa điểm', icon: '📍' },
    { id: 'tickets', label: 'Loại vé', icon: '🎫' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
  ] as const

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* BASIC INFO TAB */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tiêu đề sự kiện <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="VD: Workshop Next.js 2024"
                  required
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Slug (URL) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="workshop-nextjs-2024"
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    disabled={isGeneratingSlug || !formData.title}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingSlug ? 'Đang tạo...' : 'Tạo tự động'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  URL: /events/{formData.slug || 'slug-cua-ban'}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mô tả ngắn
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn gọn về sự kiện (hiển thị trong danh sách)"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.description?.length || 0}/500 ký tự
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Danh mục</label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value || undefined }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Registration Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bắt đầu đăng ký</label>
                  <input
                    type="datetime-local"
                    value={formData.registration_start || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_start: e.target.value || undefined }))}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kết thúc đăng ký</label>
                  <input
                    type="datetime-local"
                    value={formData.registration_end || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_end: e.target.value || undefined }))}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Max Attendees */}
              <div>
                <label className="block text-sm font-medium mb-2">Số người tham gia tối đa</label>
                <input
                  type="number"
                  value={formData.max_attendees || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_attendees: e.target.value ? Number(e.target.value) : undefined }))}
                  min="1"
                  placeholder="Không giới hạn"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status & Featured */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Nháp</option>
                    <option value="published">Xuất bản</option>
                    <option value="cancelled">Đã hủy</option>
                    <option value="completed">Đã kết thúc</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="is_featured" className="text-sm">
                    ⭐ Đánh dấu là sự kiện nổi bật
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* CONTENT TAB */}
          {activeTab === 'content' && (
            <div>
              <label className="block text-sm font-medium mb-2">Nội dung chi tiết</label>
              <RichTextEditor
                value={formData.content || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                placeholder="Viết nội dung chi tiết về sự kiện..."
              />
            </div>
          )}

          {/* MEDIA TAB */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <ImageUpload
                label="Ảnh đại diện"
                description="Ảnh hiển thị trong danh sách sự kiện (khuyến nghị 4:3)"
                value={formData.featured_image}
                onChange={(url) => setFormData(prev => ({ ...prev, featured_image: url }))}
                onRemove={() => setFormData(prev => ({ ...prev, featured_image: undefined }))}
                aspectRatio={4 / 3}
                folder="events/featured"
              />

              <ImageUpload
                label="Ảnh banner"
                description="Ảnh banner lớn (khuyến nghị 21:9)"
                value={formData.banner_image}
                onChange={(url) => setFormData(prev => ({ ...prev, banner_image: url }))}
                onRemove={() => setFormData(prev => ({ ...prev, banner_image: undefined }))}
                aspectRatio={21 / 9}
                folder="events/banners"
              />

              <GalleryUpload
                value={formData.gallery || []}
                onChange={(urls) => setFormData(prev => ({ ...prev, gallery: urls }))}
                maxImages={10}
              />
            </div>
          )}

          {/* LOCATION TAB */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Tên địa điểm</label>
                <input
                  type="text"
                  value={formData.location_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                  placeholder="VD: Bitexco Financial Tower"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Địa chỉ</label>
                <textarea
                  value={formData.location_address || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_address: e.target.value }))}
                  placeholder="VD: 36 Hồ Tùng Mậu, Quận 1, TP.HCM"
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Google Maps Embed URL
                </label>
                <input
                  type="url"
                  value={formData.location_map_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_map_url: e.target.value }))}
                  placeholder="https://www.google.com/maps/embed?..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Vào Google Maps → Share → Embed a map → Copy HTML → Lấy URL trong src="..."
                </p>

                {/* Preview */}
                {formData.location_map_url && (
                  <div className="mt-3 aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                    <iframe
                      src={formData.location_map_url}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TICKETS TAB */}
          {activeTab === 'tickets' && (
            <TicketTypesEditor
              value={formData.ticket_types}
              onChange={(tickets) => setFormData(prev => ({ ...prev, ticket_types: tickets }))}
            />
          )}

          {/* SEO TAB */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Meta Title</label>
                <input
                  type="text"
                  value={formData.meta_title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="Để trống sẽ dùng tiêu đề sự kiện"
                  maxLength={60}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.meta_title?.length || 0}/60 ký tự
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Meta Description</label>
                <textarea
                  value={formData.meta_description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="Để trống sẽ dùng mô tả ngắn"
                  rows={3}
                  maxLength={160}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.meta_description?.length || 0}/160 ký tự
                </p>
              </div>

              <ImageUpload
                label="Open Graph Image"
                description="Ảnh hiển thị khi share trên mạng xã hội (1200x630px)"
                value={formData.og_image}
                onChange={(url) => setFormData(prev => ({ ...prev, og_image: url }))}
                onRemove={() => setFormData(prev => ({ ...prev, og_image: undefined }))}
                aspectRatio={1200 / 630}
                folder="events/og"
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="px-6 py-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isPending && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {mode === 'create' ? 'Tạo sự kiện' : 'Cập nhật sự kiện'}
        </button>
      </div>
    </form>
  )
}