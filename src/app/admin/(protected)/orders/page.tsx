import { getOrders } from '@/app/checkout/actions'
import OrdersTable from '@/components/admin/orders-table'

export const dynamic = 'force-dynamic'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const paymentStatus = searchParams.status

  const orders = await getOrders({
    paymentStatus,
    limit: 100,
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý đơn hàng</h1>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2 border-b">
        <a
          href="/admin/orders"
          className={`px-4 py-2 border-b-2 transition ${
            !paymentStatus
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Tất cả
        </a>
        <a
          href="/admin/orders?status=pending"
          className={`px-4 py-2 border-b-2 transition ${
            paymentStatus === 'pending'
              ? 'border-orange-600 text-orange-600 font-semibold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Chờ thanh toán
        </a>
        <a
          href="/admin/orders?status=paid"
          className={`px-4 py-2 border-b-2 transition ${
            paymentStatus === 'paid'
              ? 'border-green-600 text-green-600 font-semibold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Đã thanh toán
        </a>
        <a
          href="/admin/orders?status=failed"
          className={`px-4 py-2 border-b-2 transition ${
            paymentStatus === 'failed'
              ? 'border-red-600 text-red-600 font-semibold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Thất bại
        </a>
      </div>

      <OrdersTable orders={orders} />
    </div>
  )
}
