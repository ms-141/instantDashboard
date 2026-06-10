import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function dueDateClass(dueDate: string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return 'text-red-600 font-semibold'
  if (diff <= 3) return 'text-amber-600 font-semibold'
  return 'text-gray-700'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: allOrders } = await supabase
    .from('orders')
    .select('*, customer:customers(name)')
    .order('due_date', { ascending: true })

  const orders = allOrders ?? []
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const active = orders.filter(o => o.status === 'new' || o.status === 'in_progress')
  const overdue = active.filter(o => new Date(o.due_date + 'T00:00:00') < today)
  const dueThisWeek = active.filter(o => {
    const diff = Math.floor((new Date(o.due_date + 'T00:00:00').getTime() - today.getTime()) / 86400000)
    return diff >= 0 && diff <= 7
  })
  const completedThisMonth = orders.filter(o => {
    if (o.status !== 'completed' && o.status !== 'delivered') return false
    const u = new Date(o.updated_at)
    return u.getMonth() === today.getMonth() && u.getFullYear() === today.getFullYear()
  })

  const stats = [
    { label: 'Active Orders',        value: active.length,              cls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    { label: 'Overdue',              value: overdue.length,             cls: overdue.length > 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-100' },
    { label: 'Due This Week',        value: dueThisWeek.length,         cls: dueThisWeek.length > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-gray-50 text-gray-600 border-gray-100' },
    { label: 'Completed This Month', value: completedThisMonth.length,  cls: 'bg-green-50 text-green-700 border-green-100' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/orders/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + New Order
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className={`rounded-xl border p-5 ${s.cls}`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Active Orders � soonest due first</h2>
          <Link href="/orders" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>

        {active.length === 0 ? (
          <p className="text-gray-400 text-sm px-6 py-10 text-center">
            No active orders.{' '}
            <Link href="/orders/new" className="text-indigo-600 hover:underline">Create one?</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                  <th className="px-6 py-3 font-medium">Order #</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {active.map(order => (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/orders/${order.id}`} className="text-indigo-600 hover:underline font-medium">
                        {order.order_number || order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{order.customer?.name}</td>
                    <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                    <td className={`px-6 py-3 ${dueDateClass(order.due_date)}`}>
                      {formatDate(order.due_date)}
                      {new Date(order.due_date + 'T00:00:00') < today && (
                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">overdue</span>
                      )}
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
