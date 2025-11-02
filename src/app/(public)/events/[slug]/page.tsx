// src/app/(public)/events/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getPublicEventBySlug, getRelatedEvents } from '../actions'
import { getHeroImageUrl, getCardImageUrl } from '@/lib/cloudinary'
import { EventCard } from '@/components/public/event-card'
import { TicketSelector } from '@/components/public/ticket-selector'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let event
  try {
    event = await getPublicEventBySlug(slug)
  } catch (error) {
    notFound()
  }

  const relatedEvents = await getRelatedEvents(event.id, event.category_id, 3)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isSoldOut = event.current_attendees >= (event.max_attendees || Infinity)
  const isUpcoming = new Date(event.start_date) > new Date()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Banner */}
      {event.banner_image ? (
        <div className="relative h-96 bg-slate-900">
          <img
            src={getHeroImageUrl(event.banner_image) || event.banner_image}
            alt={event.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-br from-blue-600 to-purple-600" />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:gap-8 -mt-12 relative z-10">
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Featured Image Card */}
            {event.featured_image && (
              <div className="mb-6 rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={getCardImageUrl(event.featured_image) || event.featured_image}
                  alt={event.title}
                  className="w-full"
                />
              </div>
            )}

            {/* Event Info Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 mb-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
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
                {event.is_featured && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-sm font-semibold rounded-full">
                    ⭐ Nổi bật
                  </span>
                )}
                {isSoldOut && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm font-semibold rounded-full">
                    Hết vé
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

              {/* Description */}
              {event.description && (
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                  {event.description}
                </p>
              )}

              {/* Meta Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                {/* Date */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Thời gian</p>
                    <p className="font-semibold">{formatDate(event.start_date)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {formatTime(event.start_date)} - {formatTime(event.end_date)}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {event.location_name && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Địa điểm</p>
                      <p className="font-semibold">{event.location_name}</p>
                      {event.location_address && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {event.location_address}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Attendees */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Số người tham gia</p>
                    <p className="font-semibold">
                      {event.current_attendees}
                      {event.max_attendees && ` / ${event.max_attendees}`}
                    </p>
                  </div>
                </div>

                {/* Views */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Lượt xem</p>
                    <p className="font-semibold">{event.views_count}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              {event.content && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-4">Thông tin chi tiết</h2>
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.content }}
                  />
                </div>
              )}

              {/* Gallery */}
              {event.gallery && event.gallery.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Hình ảnh</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

              {/* Map */}
              {event.location_map_url && (
                <div className="mt-6">
                  <h2 className="text-2xl font-bold mb-4">Bản đồ</h2>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={event.location_map_url}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className="lg:sticky lg:top-4">
              {/* Ticket Selector */}
              {isUpcoming && !isSoldOut && (
                <TicketSelector event={event} />
              )}

              {isSoldOut && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 mb-6">
                  <div className="text-center">
                    <div className="text-4xl mb-3">🎫</div>
                    <h3 className="text-xl font-bold mb-2">Đã hết vé</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Sự kiện này đã hết vé. Hãy theo dõi các sự kiện khác nhé!
                    </p>
                  </div>
                </div>
              )}

              {!isUpcoming && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 mb-6">
                  <div className="text-center">
                    <div className="text-4xl mb-3">✅</div>
                    <h3 className="text-xl font-bold mb-2">Sự kiện đã diễn ra</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Sự kiện này đã kết thúc.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <div className="py-12">
            <h2 className="text-3xl font-bold mb-6">Sự kiện liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedEvents.map((relatedEvent) => (
                <EventCard key={relatedEvent.id} event={relatedEvent} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  try {
    const event = await getPublicEventBySlug(slug)
    return {
      title: `${event.title} - Orochi Platform`,
      description: event.description || event.title,
      openGraph: {
        title: event.meta_title || event.title,
        description: event.meta_description || event.description,
        images: event.og_image ? [event.og_image] : event.featured_image ? [event.featured_image] : [],
      },
    }
  } catch {
    return {
      title: 'Event Not Found',
    }
  }
}