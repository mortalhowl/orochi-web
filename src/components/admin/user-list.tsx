'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Eye, User, Award } from 'lucide-react'
import { formatNumber, formatDate as formatDateUtil } from '@/lib/format'

type UserProfile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  total_points: number
  current_points: number
  lifetime_points: number
  rank_id: string | null
  created_at: string
  rank?: {
    id: string
    name: string
    color: string
  } | null
}

type UserListProps = {
  users: UserProfile[]
  currentPage: number
  totalPages: number
}

export function UserList({ users, currentPage, totalPages }: UserListProps) {
  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString)
  }

  if (!users || users.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <p className="text-slate-600">Không tìm thấy người dùng nào</p>
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
                Người dùng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Số điện thoại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Hạng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Điểm hiện tại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Ngày tham gia
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.full_name || user.email}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-slate-900">
                        {user.full_name || 'Chưa cập nhật'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{user.phone || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.rank ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${user.rank.color}20`,
                        color: user.rank.color,
                      }}
                    >
                      <Award className="w-3.5 h-3.5" />
                      {user.rank.name}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">Chưa có hạng</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-blue-600">
                    {formatNumber(user.current_points)} điểm
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{formatDate(user.created_at)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.full_name || user.email}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-slate-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 mb-0.5">
                  {user.full_name || 'Chưa cập nhật'}
                </h3>
                <p className="text-sm text-slate-600 truncate">{user.email}</p>
                {user.rank && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium mt-2"
                    style={{
                      backgroundColor: `${user.rank.color}20`,
                      color: user.rank.color,
                    }}
                  >
                    <Award className="w-3.5 h-3.5" />
                    {user.rank.name}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="ml-2 text-slate-900">{user.phone || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Điểm:</span>
                <span className="ml-2 font-semibold text-blue-600">
                  {formatNumber(user.current_points)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Ngày tham gia:</span>
                <span className="ml-2 text-slate-900">{formatDate(user.created_at)}</span>
              </div>
            </div>

            <Link
              href={`/admin/users/${user.id}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Xem chi tiết
            </Link>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
          <div className="flex-1 flex justify-between sm:hidden">
            {currentPage > 1 ? (
              <Link
                href={`/admin/users?page=${currentPage - 1}`}
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
                href={`/admin/users?page=${currentPage + 1}`}
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
                    href={`/admin/users?page=${currentPage - 1}`}
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
                    href={`/admin/users?page=${currentPage + 1}`}
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
