// src/components/admin/ticket-types-editor.tsx
'use client'

import { useState } from 'react'
import type { CreateTicketTypeInput } from '@/types/events.types'

type TicketTypesEditorProps = {
  value: CreateTicketTypeInput[]
  onChange: (value: CreateTicketTypeInput[]) => void
  disabled?: boolean
}

export function TicketTypesEditor({ value, onChange, disabled = false }: TicketTypesEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const addTicketType = () => {
    const newTicket: CreateTicketTypeInput = {
      name: '',
      description: '',
      price: 0,
      quantity: 100,
      benefits: [],
      points_earned: 0,
      is_active: true,
      sort_order: value.length,
    }
    onChange([...value, newTicket])
    setExpandedIndex(value.length)
  }

  const removeTicketType = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
    setExpandedIndex(null)
  }

  const updateTicketType = (index: number, updates: Partial<CreateTicketTypeInput>) => {
    const newValue = [...value]
    newValue[index] = { ...newValue[index], ...updates }
    onChange(newValue)
  }

  const moveTicketType = (index: number, direction: 'up' | 'down') => {
    const newValue = [...value]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= value.length) return
    
    [newValue[index], newValue[newIndex]] = [newValue[newIndex], newValue[index]]
    
    // Update sort_order
    newValue.forEach((ticket, i) => {
      ticket.sort_order = i
    })
    
    onChange(newValue)
    setExpandedIndex(newIndex)
  }

  const addBenefit = (ticketIndex: number) => {
    const ticket = value[ticketIndex]
    const benefit = prompt('Nhập lợi ích:')
    if (benefit) {
      updateTicketType(ticketIndex, {
        benefits: [...(ticket.benefits || []), benefit],
      })
    }
  }

  const removeBenefit = (ticketIndex: number, benefitIndex: number) => {
    const ticket = value[ticketIndex]
    const newBenefits = [...(ticket.benefits || [])]
    newBenefits.splice(benefitIndex, 1)
    updateTicketType(ticketIndex, { benefits: newBenefits })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">
          Loại vé <span className="text-red-500">*</span>
        </label>
        {!disabled && (
          <button
            type="button"
            onClick={addTicketType}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Thêm loại vé
          </button>
        )}
      </div>

      {value.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <p className="text-slate-600 dark:text-slate-400 mb-3">
            Chưa có loại vé nào
          </p>
          <button
            type="button"
            onClick={addTicketType}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tạo loại vé đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((ticket, index) => (
            <div
              key={index}
              className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  expandedIndex === index ? 'bg-slate-50 dark:bg-slate-800' : ''
                }`}
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col gap-1">
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveTicketType(index, 'up')
                        }}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveTicketType(index, 'down')
                        }}
                        disabled={index === value.length - 1}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold">
                      {ticket.name || `Loại vé ${index + 1}`}
                    </p>
                    <p className="text-sm text-slate-500">
                      {ticket.price?.toLocaleString('vi-VN')}đ • {ticket.quantity} vé
                    </p>
                  </div>

                  {!ticket.is_active && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                      Không hoạt động
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Xóa loại vé này?')) {
                          removeTicketType(index)
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded content */}
              {expandedIndex === index && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Tên loại vé <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ticket.name}
                      onChange={(e) => updateTicketType(index, { name: e.target.value })}
                      placeholder="VD: Early Bird, VIP, Standard"
                      disabled={disabled}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Mô tả</label>
                    <textarea
                      value={ticket.description || ''}
                      onChange={(e) => updateTicketType(index, { description: e.target.value })}
                      placeholder="Mô tả ngắn về loại vé này"
                      disabled={disabled}
                      rows={2}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Price & Quantity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Giá (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={ticket.price}
                        onChange={(e) => updateTicketType(index, { price: Number(e.target.value) })}
                        min="0"
                        disabled={disabled}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Số lượng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={ticket.quantity}
                        onChange={(e) => updateTicketType(index, { quantity: Number(e.target.value) })}
                        min="1"
                        disabled={disabled}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Sale Period */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Bắt đầu bán</label>
                      <input
                        type="datetime-local"
                        value={ticket.sale_start || ''}
                        onChange={(e) => updateTicketType(index, { sale_start: e.target.value })}
                        disabled={disabled}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Kết thúc bán</label>
                      <input
                        type="datetime-local"
                        value={ticket.sale_end || ''}
                        onChange={(e) => updateTicketType(index, { sale_end: e.target.value })}
                        disabled={disabled}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Points Earned */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Điểm thưởng khi mua
                    </label>
                    <input
                      type="number"
                      value={ticket.points_earned || 0}
                      onChange={(e) => updateTicketType(index, { points_earned: Number(e.target.value) })}
                      min="0"
                      disabled={disabled}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Số điểm người dùng nhận được khi mua vé này
                    </p>
                  </div>

                  {/* Benefits */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Quyền lợi</label>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => addBenefit(index)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          + Thêm
                        </button>
                      )}
                    </div>
                    {ticket.benefits && ticket.benefits.length > 0 ? (
                      <ul className="space-y-2">
                        {ticket.benefits.map((benefit, benefitIndex) => (
                          <li
                            key={benefitIndex}
                            className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                          >
                            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="flex-1 text-sm">{benefit}</span>
                            {!disabled && (
                              <button
                                type="button"
                                onClick={() => removeBenefit(index, benefitIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">Chưa có quyền lợi nào</p>
                    )}
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`active-${index}`}
                      checked={ticket.is_active}
                      onChange={(e) => updateTicketType(index, { is_active: e.target.checked })}
                      disabled={disabled}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor={`active-${index}`} className="text-sm">
                      Loại vé này đang hoạt động
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}