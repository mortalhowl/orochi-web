// src/app/profile/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/public-header'
import { AvatarWithRank } from '@/components/auth/avatar-with-rank'
import { 
  getUserPointsSummary, 
  getPointTransactions,
  getRankHistory 
} from './actions'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile với rank
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      rank:ranks!profiles_rank_id_fkey(*)
    `)
    .eq('id', user.id)
    .single()

  // Fetch points summary
  const pointsSummary = await getUserPointsSummary()
  
  // Fetch recent transactions
  const recentTransactions = await getPointTransactions(5)

  // Fetch rank history
  const rankHistory = await getRankHistory()

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Thông tin cá nhân</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <div className="flex justify-center mb-4">
                <AvatarWithRank 
                  user={user} 
                  profile={profile}
                  size="xl"
                  showBadge
                />
              </div>
              
              <h2 className="text-xl font-bold mb-1">
                {user.user_metadata.full_name || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {user.email}
              </p>

              {/* Rank badge */}
              {profile?.rank && (
                <div className="inline-block mb-4">
                  <div 
                    className="px-4 py-2 rounded-full font-semibold text-sm"
                    style={{ 
                      backgroundColor: `${profile.rank.color}20`,
                      color: profile.rank.color,
                    }}
                  >
                    🏆 {profile.rank.display_name}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Điểm hiện có</p>
                  <p className="text-lg font-bold text-amber-600">
                    {profile?.current_points.toLocaleString()}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Tổng điểm</p>
                  <p className="text-lg font-bold">
                    {profile?.total_points.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Edit button */}
              <button className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                Chỉnh sửa thông tin
              </button>
            </div>

            {/* Rank Benefits */}
            {profile?.rank && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <span>Đặc quyền hạng {profile.rank.display_name}</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Hệ số tích điểm</span>
                    <span className="font-semibold">x{profile.rank.point_multiplier}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Giảm giá</span>
                    <span className="font-semibold text-green-600">
                      {profile.rank.discount_percentage}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Points Progress */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Tiến độ thăng hạng</h3>
              
              {pointsSummary.next_rank ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm opacity-90">Hạng tiếp theo</p>
                      <p className="text-xl font-bold">
                        {pointsSummary.next_rank.display_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-90">Còn thiếu</p>
                      <p className="text-xl font-bold">
                        {pointsSummary.points_to_next_rank.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-white h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(profile!.total_points / pointsSummary.next_rank.min_points) * 100}%` 
                      }}
                    />
                  </div>

                  <p className="text-xs opacity-75 mt-2">
                    {profile!.total_points.toLocaleString()} / {pointsSummary.next_rank.min_points.toLocaleString()} điểm
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xl font-bold mb-2">🎉 Chúc mừng!</p>
                  <p className="opacity-90">Bạn đã đạt hạng cao nhất</p>
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Giao dịch gần đây</h3>
                <a 
                  href="/points" 
                  className="text-sm text-primary hover:underline"
                >
                  Xem tất cả
                </a>
              </div>

              <div className="space-y-3">
                {recentTransactions.map((tx) => {
                  const isPositive = tx.points > 0
                  const typeColors = {
                    earn: 'text-green-600 bg-green-100 dark:bg-green-900/20',
                    spend: 'text-red-600 bg-red-100 dark:bg-red-900/20',
                    bonus: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
                    expire: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
                  }
                  const colorClass = typeColors[tx.type as keyof typeof typeColors] || 'text-foreground bg-muted'

                  return (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                          {isPositive ? '↑' : '↓'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tx.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <p className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{tx.points.toLocaleString()}
                      </p>
                    </div>
                  )
                })}

                {recentTransactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Chưa có giao dịch nào</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rank History */}
            {rankHistory.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Lịch sử thăng hạng</h3>
                <div className="space-y-4">
                  {rankHistory.map((history) => (
                    <div 
                      key={history.id}
                      className="flex items-center gap-4 p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {history.from_rank && (
                          <>
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: history.from_rank.color }}
                            />
                            <span className="text-sm">{history.from_rank.display_name}</span>
                          </>
                        )}
                        <span className="text-muted-foreground">→</span>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: history.to_rank.color }}
                        />
                        <span className="text-sm font-semibold">{history.to_rank.display_name}</span>
                      </div>
                      <div className="ml-auto text-xs text-muted-foreground">
                        {new Date(history.changed_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}