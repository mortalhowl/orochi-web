// src/components/public/ticket-selector.tsx
'use client'

import { useState } from 'react'
import type { EventWithDetails } from '@/types/events.types'

type TicketSelectorProps = {
  event: EventWithDetails
}

export function TicketSelector({ event }: TicketSelectorProps) {
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})

  const handleQuantityChange = (ticketId: string, quantity: number) => {
    if (quantity === 0) {
      const newSelected = { ...selectedTickets }
      delete newSelected[ticketId]
      setSelectedTickets(newSelected)
    } else {
      setSelectedTickets({
        ...selectedTickets,
        [ticketId]: quantity,
      })
    }
  }

  const getTotalPrice = () => {
    let total = 0
    Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
      const ticket = event.ticket_types?.find(t => t.id === ticketId)
      if (ticket) {
        total += ticket.price * quantity
      }
    })
    return total
  }

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)
  }

  const totalPrice = getTotalPrice()
  const totalTickets = getTotalTickets()

  const handleCheckout = () => {
    // Build query params with selected tickets
    const params = new URLSearchParams()
    Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
      params.append(`ticket_${ticketId}`, quantity.toString())
    })

    // Navigate to checkout page
    window.location.href = `/checkout?event=${event.slug}&${params.toString()}`
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 sticky top-4">
      <h3 className="text-2xl font-bold mb-4">Chọn vé</h3>

      {/* Ticket Types */}
      <div className="space-y-4 mb-6">
        {event.ticket_types?.filter(t => t.is_active).map((ticket) => {
          const available = ticket.quantity - ticket.sold_count
          const isSoldOut = available <= 0
          const selectedQty = selectedTickets[ticket.id] || 0

          return (
            <div
              key={ticket.id}
              className={`p-4 border border-slate-200 dark:border-slate-700 rounded-lg ${
                isSoldOut ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold">{ticket.name}</h4>
                  {ticket.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {ticket.description}
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-xl font-bold text-blue-600">
                    {ticket.price === 0 ? 'Miễn phí' : `${ticket.price.toLocaleString('vi-VN')}đ`}
                  </p>
                  <p className="text-xs text-slate-500">
                    Còn {available} vé
                  </p>
                </div>
              </div>

              {/* Benefits */}
              {ticket.benefits && ticket.benefits.length > 0 && (
                <ul className="space-y-1 mb-3">
                  {ticket.benefits.map((benefit, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Points */}
              {ticket.points_earned > 0 && (
                <p className="text-sm text-amber-600 mb-3">
                  🎁 Nhận {ticket.points_earned} điểm thưởng
                </p>
              )}

              {/* Quantity Selector */}
              {!isSoldOut && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(ticket.id, Math.max(0, selectedQty - 1))}
                    disabled={selectedQty === 0}
                    className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold">{selectedQty}</span>
                  <button
                    onClick={() => handleQuantityChange(ticket.id, Math.min(available, selectedQty + 1))}
                    disabled={selectedQty >= available}
                    className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              )}

              {isSoldOut && (
                <p className="text-sm text-red-600 font-semibold">Hết vé</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Total */}
      {totalTickets > 0 && (
        <>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 dark:text-slate-400">Tổng số vé:</span>
              <span className="font-semibold">{totalTickets}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Tổng thanh toán:</span>
              <span className="text-2xl font-bold text-blue-600">
                {totalPrice === 0 ? 'Miễn phí' : `${totalPrice.toLocaleString('vi-VN')}đ`}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Đăng ký tham gia
          </button>
        </>
      )}

      {totalTickets === 0 && (
        <p className="text-center text-slate-500 dark:text-slate-400 text-sm">
          Chọn số lượng vé để tiếp tục
        </p>
      )}
    </div>
  )
}