import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function ImportsPage() {
  const supabase = await createClient()
  const { data: imports } = await supabase
    .from('imported_orders')
    .select('id, customer_name, due_date, order_status, review_status, created_at')
    .eq('review_status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Imported Orders</h1>
        <p className="text-sm text-gray-500">
          Review before creating live orders
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {!imports?.length ? (
          <p className="text-gray-400 text-sm px-6 py-10 text-center">No pending imports.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Due Date</th>
                  <th className="px-6 py-3 font-medium">Order Status</th>
                  <th className="px-6 py-3 font-medium">Imported At</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {imports.map(item => (
                  <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-gray-800 font-medium">{item.customer_name}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {item.due_date ? formatDate(`${item.due_date}T00:00:00`) : 'Missing'}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{item.order_status}</td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-3">
                      <Link href={`/imports/${item.id}`} className="text-indigo-600 hover:underline text-xs font-medium">
                        Review
                      </Link>
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
