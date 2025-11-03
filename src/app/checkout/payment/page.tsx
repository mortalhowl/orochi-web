import { redirect } from 'next/navigation'
import { getOrderById } from '@/app/checkout/actions'
import PaymentView from '@/components/checkout/payment-view'

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const params = await searchParams
  const orderId = params.order

  if (!orderId) {
    redirect('/events')
  }

  const order = await getOrderById(orderId)

  if (!order) {
    redirect('/events')
  }

  // If already paid, redirect to success page
  if (order.payment_status === 'paid') {
    redirect(`/checkout/success?order=${orderId}`)
  }

  // Check if order expired - redirect to home
  const expiresAt = new Date(order.expires_at)
  const now = new Date()

  if (now > expiresAt) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <PaymentView order={order} />
      </div>
    </div>
  )
}
