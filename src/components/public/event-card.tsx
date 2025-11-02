// src/components/public/event-card.tsx
import Link from 'next/link'
import type { EventWithDetails } from '@/types/events.types'
import { getCardImageUrl } from '@/lib/cloudinary'

type EventCardProps = {
  event: EventWithDetails
  variant?: 'default' | 'featured'
}

export function EventCard({ event, variant = 'default' }: EventCardProps) {
  const isFeatured = variant === 'featured'
  const minPrice = Math.min(...(event.ticket_types?.map(t => t.price) || [0]))
  const isFree = minPrice === 0
  const isSoldOut = event.current_attendees >= (event.max_attendees || Infinity)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Link
      href={`/events/${event.slug}`}
      className={`group block bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 ${
        isFeatured ? 'lg:flex' : ''
      }`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${
        isFeatured ? 'lg:w-1/2' : 'aspect-[16/9]'
      }`}>
        {event.featured_image ? (
          <img
            src={getCardImageUrl(event.featured_image) || event.featured_image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {event.is_featured && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded">
              ⭐ Nổi bật
            </span>
          )}
          {isSoldOut && (
            <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
              Hết vé
            </span>
          )}
        </div>

        {/* Category Badge */}
        {event.category && (
          <div className="absolute bottom-3 left-3">
            <span
              className="inline-block px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm"
              style={{
                backgroundColor: `${event.category.color}20`,
                color: event.category.color,
                border: `1px solid ${event.category.color}40`,
              }}
            >
              {event.category.icon} {event.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-5 ${isFeatured ? 'lg:w-1/2 flex flex-col justify-between' : ''}`}>
        <div>
          {/* Title */}
          <h3 className={`font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 ${
            isFeatured ? 'text-2xl' : 'text-lg'
          }`}>
            {event.title}
          </h3>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">
              {formatDate(event.start_date)}
            </span>
            <span>•</span>
            <span>{formatTime(event.start_date)}</span>
          </div>

          {/* Location */}
          {event.location_name && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{event.location_name}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          {/* Price */}
          <div>
            {isFree ? (
              <span className="text-lg font-bold text-green-600">Miễn phí</span>
            ) : (
              <div>
                <p className="text-xs text-slate-500">Từ</p>
                <p className="text-lg font-bold text-blue-600">
                  {minPrice.toLocaleString('vi-VN')}đ
                </p>
              </div>
            )}
          </div>

          {/* Attendees */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>
              {event.current_attendees}
              {event.max_attendees && ` / ${event.max_attendees}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}