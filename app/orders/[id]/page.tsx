import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { notFound } from 'next/navigation'
import { deleteOrder } from '@/app/actions/orders'
import DeleteButton from '@/components/DeleteButton'
import type { OrderLogo, OrderGarment } from '@/types'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, customer:customers(*), logos:order_logos(*), garments:order_garments(*)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const deleteThisOrder = deleteOrder.bind(null, id)
  const logoTotal = (order.logos ?? []).reduce((sum: number, logo: OrderLogo) => sum + (logo.price ?? 0), 0)
  const garmentTotal = (order.garments ?? []).reduce(
    (sum: number, garment: OrderGarment) => sum + (garment.price ?? 0) * garment.quantity,
    0
  )
  const orderTotal = logoTotal + garmentTotal

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/orders" className="text-gray-400 hover:text-gray-600 text-sm">← Orders</Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {order.order_number ? `Order ${order.order_number}` : `Order #${order.id.slice(0, 8)}`}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Created {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/orders/${id}/edit`}
            className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
            Edit
          </Link>
          <DeleteButton
            action={deleteThisOrder}
            message="Delete this order? This cannot be undone."
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Customer</p>
          <Link href={`/customers/${order.customer.id}`} className="font-medium text-indigo-700 hover:underline">
            {order.customer.name}
          </Link>
          {order.customer.phone && <p className="text-sm text-gray-500 mt-0.5">{order.customer.phone}</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Status</p>
          <StatusBadge status={order.status} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Due Date</p>
          <p className="font-medium text-gray-800">{formatDate(order.due_date)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Order Total</p>
          <p className="font-semibold text-emerald-700">{formatCurrency(orderTotal)}</p>
        </div>
      </div>

      {order.notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-sm text-amber-800">
          <strong>Notes:</strong> {order.notes}
        </div>
      )}

      {/* Logos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Logos ({order.logos?.length ?? 0}) · {formatCurrency(logoTotal)}
          </h2>
        </div>
        {!order.logos?.length ? (
          <p className="text-gray-400 text-sm px-6 py-5">No logos on this order.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {order.logos.map((logo: OrderLogo) => (
              <div key={logo.id} className="px-6 py-4 flex items-start gap-6">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{logo.name || 'Untitled Logo'}</p>
                  <p className="text-sm text-gray-500">{logo.placement}</p>
                  {logo.price !== null && logo.price !== undefined && (
                    <p className="text-sm text-emerald-700 mt-1">{formatCurrency(logo.price)}</p>
                  )}
                  {logo.notes && <p className="text-sm text-gray-400 mt-1">{logo.notes}</p>}
                </div>
                <span className="shrink-0 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-sm font-medium">
                  {logo.width_inches}&Prime; × {logo.height_inches}&Prime;
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Garments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Garments ({order.garments?.length ?? 0}) · {formatCurrency(garmentTotal)}
          </h2>
        </div>
        {!order.garments?.length ? (
          <p className="text-gray-400 text-sm px-6 py-5">No garments on this order.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-50">
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Qty</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Line Total</th>
                  <th className="px-6 py-3 font-medium">Color</th>
                  <th className="px-6 py-3 font-medium">Sizes</th>
                  <th className="px-6 py-3 font-medium">Supplied By</th>
                  <th className="px-6 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {order.garments.map((g: OrderGarment) => (
                  <tr key={g.id} className="border-t border-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-700">{g.garment_type}</td>
                    <td className="px-6 py-3 text-gray-600">{g.quantity}</td>
                    <td className="px-6 py-3 text-gray-600">{g.price !== null ? formatCurrency(g.price) : '—'}</td>
                    <td className="px-6 py-3 text-emerald-700 font-medium">{formatCurrency((g.price ?? 0) * g.quantity)}</td>
                    <td className="px-6 py-3 text-gray-600">{g.color || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{g.sizes || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        g.supplied_by === 'us'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {g.supplied_by === 'us' ? 'Us' : 'Customer'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{g.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
