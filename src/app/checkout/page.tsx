import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import CheckoutForm from '@/components/checkout/checkout-form'
import { createClient } from '@/lib/supabase/server'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>
}) {
  const params = await searchParams
  const eventSlug = params.event

  if (!eventSlug) {
    redirect('/events')
  }

  const supabase = await createClient()

  // Lấy thông tin event và ticket types
  const { data: event, error } = await supabase
    .from('events')
    .select(
      `
      *,
      ticket_types(*)
    `
    )
    .eq('slug', eventSlug)
    .eq('status', 'published')
    .single()

  if (error || !event) {
    redirect('/events')
  }

  // Check if event is still accepting registrations
  const now = new Date()
  const registrationEnd = event.registration_end
    ? new Date(event.registration_end)
    : new Date(event.start_date)

  if (now > registrationEnd) {
    redirect(`/events/${eventSlug}`)
  }

  // Get user if logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    profile = profileData
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Thanh toán</h1>

        <Suspense fallback={<div>Đang tải...</div>}>
          <CheckoutForm event={event} user={user} profile={profile} />
        </Suspense>
      </div>
    </div>
  )
}
