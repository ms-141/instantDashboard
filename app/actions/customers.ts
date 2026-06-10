'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createCustomer(formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: formData.get('name') as string,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/customers')
  redirect(`/customers/${data.id}`)
}

export async function updateCustomer(customerId: string, formData: FormData) {
  const supabase = await createClient()

  await supabase
    .from('customers')
    .update({
      name: formData.get('name') as string,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', customerId)

  revalidatePath('/customers')
  revalidatePath(`/customers/${customerId}`)
  redirect(`/customers/${customerId}`)
}

export async function deleteCustomer(customerId: string) {
  const supabase = await createClient()
  await supabase.from('customers').delete().eq('id', customerId)
  revalidatePath('/customers')
  redirect('/customers')
}
