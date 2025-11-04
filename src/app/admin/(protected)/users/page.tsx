import { createClient } from '@/lib/supabase/server'
import { UserList } from '@/components/admin/user-list'
import { UserFilters } from '@/components/admin/user-filters'
import { Suspense } from 'react'

type SearchParams = Promise<{
  status?: string
  search?: string
  page?: string
}>

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Get filters from search params
  const search = params.search
  const page = parseInt(params.page || '1')
  const perPage = 50

  // Try using RPC function first (if migrations applied)
  let users: any[] = []
  let count = 0
  let error: any = null

  try {
    // Get users using RPC function (bypasses RLS with admin check)
    const { data: rpcUsers, error: rpcError } = await supabase.rpc('admin_get_all_profiles', {
      search_text: search || null,
      page_number: page,
      page_size: perPage,
    })

    if (rpcError) throw rpcError

    // Get total count
    const { data: countResult, error: countError } = await supabase.rpc('admin_get_profiles_count', {
      search_text: search || null,
    })

    if (countError) throw countError

    count = countResult || 0

    // Map RPC result to match expected structure
    users = rpcUsers?.map((user: any) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      phone: user.phone,
      total_points: user.total_points,
      current_points: user.current_points,
      lifetime_points: user.lifetime_points,
      rank_id: user.rank_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      rank: user.rank_name
        ? {
            id: user.rank_id,
            name: user.rank_name,
            color: user.rank_color,
          }
        : null,
    })) || []
  } catch (rpcError) {
    // Fallback to direct query with RLS policies
    console.log('RPC function not available, using direct query with RLS')

    let query = supabase
      .from('profiles')
      .select(
        `
        *,
        rank:ranks(
          id,
          name,
          color
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    // Pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    query = query.range(from, to)

    const result = await query
    users = result.data || []
    count = result.count || 0
    error = result.error
  }

  if (error) {
    console.error('Error fetching users:', error)
  }

  // Calculate stats - try RPC first, fallback to direct query
  let totalUsers = 0
  let totalPoints = 0
  let avgPoints = 0
  let usersWithRank = 0

  try {
    const { data: allUsers } = await supabase.rpc('admin_get_all_profiles', {
      search_text: null,
      page_number: 1,
      page_size: 10000, // Get all for stats
    })

    totalUsers = allUsers?.length || 0
    totalPoints = allUsers?.reduce((sum: number, u: any) => sum + (u.current_points || 0), 0) || 0
    avgPoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0
    usersWithRank = allUsers?.filter((u: any) => u.rank_id).length || 0
  } catch {
    // Fallback to direct queries
    const { data: allUsers } = await supabase.from('profiles').select('current_points')
    totalUsers = allUsers?.length || 0
    totalPoints = allUsers?.reduce((sum, u) => sum + (u.current_points || 0), 0) || 0
    avgPoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0

    const { count: rankCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('rank_id', 'is', null)
    usersWithRank = rankCount || 0
  }

  const totalPages = count ? Math.ceil(count / perPage) : 1

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
          <p className="text-slate-600 mt-1">Tổng số {count?.toLocaleString() || 0} người dùng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Tổng người dùng</div>
          <div className="text-2xl font-bold text-slate-900">{totalUsers.toLocaleString()}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Có hạng</div>
          <div className="text-2xl font-bold text-purple-600">
            {usersWithRank.toLocaleString()}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Tổng điểm</div>
          <div className="text-2xl font-bold text-blue-600">{totalPoints.toLocaleString()}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-1">Điểm trung bình</div>
          <div className="text-2xl font-bold text-green-600">{avgPoints.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <UserFilters />

      {/* User List */}
      <Suspense
        fallback={
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4" />
            <p className="text-slate-600">Đang tải...</p>
          </div>
        }
      >
        <UserList users={users || []} currentPage={page} totalPages={totalPages} />
      </Suspense>
    </div>
  )
}
