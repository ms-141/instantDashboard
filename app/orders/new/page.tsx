import { createClient } from '@/utils/supabase/server'
import OrderForm from '@/components/OrderForm'
import Link from 'next/link'
import { createOrder } from '@/app/actions/orders'

export default async function NewOrderPage() {
  const supabase = await createClient()
  const { data: customers } = await supabase.from('customers').select('*').order('name')

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/orders" className="text-gray-400 hover:text-gray-600 text-sm">← Orders</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Order</h1>
      {!customers?.length && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          You need to{' '}
          <Link href="/customers/new" className="underline font-medium">add a customer</Link>
          {' '}first.
        </div>
      )}
      <OrderForm customers={customers ?? []} action={createOrder} />
    </div>
  )
}
