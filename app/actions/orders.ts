'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createOrder(formData: FormData) {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer_id: formData.get('customer_id') as string,
      order_number: (formData.get('order_number') as string) || null,
      status: formData.get('status') as string,
      due_date: formData.get('due_date') as string,
      notes: (formData.get('notes') as string) || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  const logos = JSON.parse((formData.get('logos') as string) || '[]')
  if (logos.length > 0) {
    await supabase.from('order_logos').insert(
      logos.map((l: Record<string, unknown>) => ({ ...l, order_id: order.id }))
    )
  }

  const garments = JSON.parse((formData.get('garments') as string) || '[]')
  if (garments.length > 0) {
    await supabase.from('order_garments').insert(
      garments.map((g: Record<string, unknown>) => ({ ...g, order_id: order.id }))
    )
  }

  revalidatePath('/')
  revalidatePath('/orders')
  redirect(`/orders/${order.id}`)
}

export async function updateOrder(orderId: string, formData: FormData) {
  const supabase = await createClient()

  await supabase
    .from('orders')
    .update({
      customer_id: formData.get('customer_id') as string,
      order_number: (formData.get('order_number') as string) || null,
      status: formData.get('status') as string,
      due_date: formData.get('due_date') as string,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', orderId)

  await supabase.from('order_logos').delete().eq('order_id', orderId)
  await supabase.from('order_garments').delete().eq('order_id', orderId)

  const logos = JSON.parse((formData.get('logos') as string) || '[]')
  if (logos.length > 0) {
    await supabase.from('order_logos').insert(
      logos.map((l: Record<string, unknown>) => ({ ...l, order_id: orderId }))
    )
  }

  const garments = JSON.parse((formData.get('garments') as string) || '[]')
  if (garments.length > 0) {
    await supabase.from('order_garments').insert(
      garments.map((g: Record<string, unknown>) => ({ ...g, order_id: orderId }))
    )
  }

  revalidatePath('/')
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  redirect(`/orders/${orderId}`)
}

export async function deleteOrder(orderId: string) {
  const supabase = await createClient()
  await supabase.from('orders').delete().eq('id', orderId)
  revalidatePath('/')
  revalidatePath('/orders')
  redirect('/orders')
}
