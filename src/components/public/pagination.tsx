// src/components/public/pagination.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type PaginationProps = {
  currentPage: number
  totalPages: number
  baseUrl: string
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  const searchParams = useSearchParams()

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    return `${baseUrl}?${params.toString()}`
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showPages = 5 // Number of page buttons to show

    if (totalPages <= showPages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex justify-center items-center gap-2">
      {/* Previous */}
      <Link
        href={currentPage > 1 ? createPageUrl(currentPage - 1) : '#'}
        className={`px-4 py-2 rounded-lg border transition-colors ${
          currentPage > 1
            ? 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            : 'border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
        }`}
        aria-disabled={currentPage <= 1}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      {/* Page Numbers */}
      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-4 py-2">
              ...
            </span>
          )
        }

        const pageNumber = page as number
        const isActive = pageNumber === currentPage

        return (
          <Link
            key={pageNumber}
            href={createPageUrl(pageNumber)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isActive
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {pageNumber}
          </Link>
        )
      })}

      {/* Next */}
      <Link
        href={currentPage < totalPages ? createPageUrl(currentPage + 1) : '#'}
        className={`px-4 py-2 rounded-lg border transition-colors ${
          currentPage < totalPages
            ? 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            : 'border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
        }`}
        aria-disabled={currentPage >= totalPages}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}