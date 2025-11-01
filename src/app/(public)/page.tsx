import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/public-header'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Nếu chưa login thì redirect về login page
  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      rank:ranks!profiles_rank_id_fkey(*)
    `)
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} profile={profile} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            Chào mừng trở lại, {user.user_metadata.full_name || user.email}! 👋
          </h1>
          
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {/* Quick Stats */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Thống kê nhanh</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Điểm hiện có:</span>
                  <span className="font-bold text-amber-600">
                    {profile?.current_points.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hạng thành viên:</span>
                  <span className="font-bold" style={{ color: profile?.rank?.color }}>
                    {profile?.rank?.display_name || 'Chưa có'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng điểm tích lũy:</span>
                  <span className="font-bold">
                    {profile?.lifetime_points.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Thao tác nhanh</h2>
              <div className="space-y-3">
                <a 
                  href="/points"
                  className="block px-4 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-center"
                >
                  Xem điểm thưởng
                </a>
                <a 
                  href="/vouchers"
                  className="block px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-center"
                >
                  Đổi voucher
                </a>
                <a 
                  href="/profile"
                  className="block px-4 py-3 border border-border rounded-md hover:bg-accent transition-colors text-center"
                >
                  Thông tin cá nhân
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}