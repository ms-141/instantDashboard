import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import DeleteButton from '@/components/DeleteButton'
import { deleteOrder } from '@/app/actions/orders'
import type { OrderStatus } from '@/types'

const ALL_STATUSES: OrderStatus[] = ['new', 'in_progress', 'completed', 'delivered', 'cancelled']
const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New', in_progress: 'In Progress', completed: 'Completed',
  delivered: 'Delivered', cancelled: 'Cancelled',
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('*, customer:customers(name)')
    .order('due_date', { ascending: true })

  if (params.status && ALL_STATUSES.includes(params.status as OrderStatus)) {
    query = query.eq('status', params.status)
  }

  const { data: orders } = await query

  const filtered = params.q
    ? (orders ?? []).filter(o =>
        o.customer?.name?.toLowerCase().includes(params.q!.toLowerCase()) ||
        o.order_number?.toLowerCase().includes(params.q!.toLowerCase())
      )
    : (orders ?? [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Link href="/orders/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + New Order
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-2 mb-6 flex-wrap">
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Search customer or order #…"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-52"
        />
        <select
          name="status"
          defaultValue={params.status || ''}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <button type="submit" className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-200">
          Filter
        </button>
        {(params.status || params.q) && (
          <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">
            Clear
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm px-6 py-10 text-center">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                  <th className="px-6 py-3 font-medium">Order #</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Due Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/orders/${order.id}`} className="text-indigo-600 hover:underline font-medium">
                        {order.order_number || order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{order.customer?.name}</td>
                    <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-6 py-3 text-gray-600">{formatDate(order.due_date)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/orders/${order.id}/edit`} className="text-xs text-gray-400 hover:text-indigo-600">
                          Edit
                        </Link>
                        <DeleteButton
                          action={deleteOrder.bind(null, order.id)}
                          message="Delete this order? This cannot be undone."
                          label="Delete"
                          className="text-xs text-red-500 hover:text-red-700"
                        />
                      </div>
                    </td>
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
