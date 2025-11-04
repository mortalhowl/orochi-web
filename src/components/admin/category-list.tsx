'use client'

import Link from 'next/link'
import { Eye, Edit2 } from 'lucide-react'
import type { EventCategory } from '@/types/events.types'

type CategoryListProps = {
  categories: EventCategory[]
  currentPage: number
  totalPages: number
}

export function CategoryList({ categories, currentPage, totalPages }: CategoryListProps) {
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Hoạt động
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Không hoạt động
      </span>
    )
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <p className="text-slate-600">Không tìm thấy danh mục nào</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Danh mục
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Icon
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Màu sắc
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Thứ tự
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-slate-500 max-w-xs truncate">
                          {category.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900 font-mono">{category.slug}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{category.icon || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {category.color ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-slate-200"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-slate-600 font-mono">{category.color}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{category.sort_order || 0}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(category.is_active)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/events/categories/${category.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/events/categories/${category.id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">{category.name}</h3>
                <p className="text-sm text-slate-600 font-mono">{category.slug}</p>
                {category.description && (
                  <p className="text-sm text-slate-500 mt-2">{category.description}</p>
                )}
              </div>
              {getStatusBadge(category.is_active)}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <span className="text-slate-500">Icon:</span>
                <span className="ml-2 text-slate-900">{category.icon || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Thứ tự:</span>
                <span className="ml-2 text-slate-900">{category.sort_order || 0}</span>
              </div>
              {category.color && (
                <div className="col-span-2">
                  <span className="text-slate-500">Màu sắc:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-6 h-6 rounded border border-slate-200"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm text-slate-600 font-mono">{category.color}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Link
                href={`/admin/events/categories/${category.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Xem chi tiết
              </Link>
              <Link
                href={`/admin/events/categories/${category.id}/edit`}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Sửa
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
          <div className="flex-1 flex justify-between sm:hidden">
            {currentPage > 1 ? (
              <Link
                href={`/admin/events/categories?page=${currentPage - 1}`}
                className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
              >
                Trước
              </Link>
            ) : (
              <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-400 bg-slate-50">
                Trước
              </span>
            )}
            {currentPage < totalPages ? (
              <Link
                href={`/admin/events/categories?page=${currentPage + 1}`}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
              >
                Sau
              </Link>
            ) : (
              <span className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-400 bg-slate-50">
                Sau
              </span>
            )}
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Trang <span className="font-medium">{currentPage}</span> trên{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {currentPage > 1 ? (
                  <Link
                    href={`/admin/events/categories?page=${currentPage - 1}`}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-l-md"
                  >
                    Trước
                  </Link>
                ) : (
                  <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-slate-50 text-sm font-medium text-slate-400 rounded-l-md">
                    Trước
                  </span>
                )}
                {currentPage < totalPages ? (
                  <Link
                    href={`/admin/events/categories?page=${currentPage + 1}`}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-r-md"
                  >
                    Sau
                  </Link>
                ) : (
                  <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-slate-50 text-sm font-medium text-slate-400 rounded-r-md">
                    Sau
                  </span>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
