import { redirect } from 'next/navigation'
import { getOrderById } from '@/app/checkout/actions'
import { createClient } from '@/lib/supabase/server'
import OrderDetailView from '@/components/admin/order-detail-view'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: orderId } = await params

  const order = await getOrderById(orderId)

  if (!order) {
    redirect('/admin/orders')
  }

  // Get current admin user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  return (
    <div className="p-6">
      <OrderDetailView order={order} adminUserId={user.id} />
    </div>
  )
}
