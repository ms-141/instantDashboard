import { createClient } from '@/utils/supabase/server'
import CustomerForm from '@/components/CustomerForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: customer } = await supabase.from('customers').select('*').eq('id', id).single()
  if (!customer) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/customers/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← {customer.name}
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Customer</h1>
      <CustomerForm customer={customer} />
    </div>
  )
}
