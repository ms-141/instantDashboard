import { createClient } from '@/utils/supabase/server'
import OrderForm from '@/components/OrderForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateOrder } from '@/app/actions/orders'

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: order }, { data: customers }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, logos:order_logos(*), garments:order_garments(*)')
      .eq('id', id)
      .single(),
    supabase.from('customers').select('*').order('name'),
  ])

  if (!order) notFound()

  const updateThisOrder = updateOrder.bind(null, id)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/orders/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">← Order</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Order</h1>
      <OrderForm customers={customers ?? []} action={updateThisOrder} order={order} />
    </div>
  )
}
