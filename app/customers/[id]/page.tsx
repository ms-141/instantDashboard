import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { notFound } from 'next/navigation'
import { deleteCustomer } from '@/app/actions/customers'
import DeleteButton from '@/components/DeleteButton'
import type { Order } from '@/types'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: customer }, { data: orders }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    supabase.from('orders').select('*').eq('customer_id', id).order('due_date', { ascending: true }),
  ])

  if (!customer) notFound()

  const deleteThisCustomer = deleteCustomer.bind(null, id)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/customers" className="text-gray-400 hover:text-gray-600 text-sm">← Customers</Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
        <div className="flex gap-2">
          <Link href={`/customers/${id}/edit`}
            className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
            Edit
          </Link>
          {!orders?.length && (
            <DeleteButton
              action={deleteThisCustomer}
              message="Delete this customer?"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Email</p>
          <p className="text-gray-800">{customer.email || '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Phone</p>
          <p className="text-gray-800">{customer.phone || '—'}</p>
        </div>
        {customer.notes && (
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-gray-700 text-sm">{customer.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Orders ({orders?.length ?? 0})</h2>
          <Link href="/orders/new" className="text-sm text-indigo-600 hover:underline">+ New Order</Link>
        </div>
        {!orders?.length ? (
          <p className="text-gray-400 text-sm px-6 py-6 text-center">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-50">
                  <th className="px-6 py-3 font-medium">Order #</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: Order) => (
                  <tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/orders/${o.id}`} className="text-indigo-600 hover:underline font-medium">
                        {o.order_number || `#${o.id.slice(0, 8)}`}
                      </Link>
                    </td>
                    <td className="px-6 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-6 py-3 text-gray-600">{formatDate(o.due_date)}</td>
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
