import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('customers')
    .select('*, orders:orders(count)')
    .order('name')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Link href="/customers/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + New Customer
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {!customers?.length ? (
          <p className="text-gray-400 text-sm px-6 py-10 text-center">
            No customers yet.{' '}
            <Link href="/customers/new" className="text-indigo-600 hover:underline">Add one?</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">Orders</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/customers/${c.id}`} className="text-indigo-600 hover:underline font-medium">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{c.email || '—'}</td>
                    <td className="px-6 py-3 text-gray-500">{c.phone || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{(c.orders as { count: number }[])?.[0]?.count ?? 0}</td>
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
