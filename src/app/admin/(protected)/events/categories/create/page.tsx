import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CategoryFormClient } from './category-form-client'

export default function CreateCategoryPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/events/categories"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Tạo danh mục mới</h1>
              <p className="text-sm text-slate-600 mt-0.5">Thêm danh mục sự kiện mới</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <CategoryFormClient />
      </div>
    </div>
  )
}
