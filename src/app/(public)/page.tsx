// src/app/(public)/home/page.tsx
import { createClient } from '@/lib/supabase/server'
// Component 'PublicHeader' đã có trong layout client rồi
// nên chúng ta không cần import lại ở đây.

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    // Fetch profile
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        rank:ranks!profiles_rank_id_fkey(*)
      `)
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {user && profile ? (
        // ===================================
        // NỘI DUNG KHI ĐÃ ĐĂNG NHẬP
        // (Đây là code từ file page.tsx cũ của bạn)
        // ===================================
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
                  <span className="font-bold" style={{ color: profile?.rank?.color || 'inherit' }}>
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
      ) : (
        // ===================================
        // NỘI DUNG KHI CHƯA ĐĂNG NHẬP
        // (Đây là nội dung trang chủ công khai,
        // chúng ta sẽ xây dựng sau)
        // ===================================
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-5xl font-bold mb-6">
            Chào mừng đến với Orochi
          </h1>
          <p className="text-xl text-muted-foreground mb-10">
            Nền tảng sự kiện và cộng đồng hàng đầu.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/events"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90"
            >
              Khám phá Sự kiện
            </a>
            <a
              href="/login"
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80"
            >
              Đăng nhập
            </a>
          </div>
        </div>
      )}
    </div>
  )
}