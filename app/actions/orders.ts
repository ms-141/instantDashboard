'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createOrder(formData: FormData) {
  const supabase = await createClient()
  const orderNumber = (formData.get('order_number') as string)?.trim() || null

  const createPayload: {
    customer_id: string
    order_number?: string
    status: string
    due_date: string
    notes: string | null
  } = {
    customer_id: formData.get('customer_id') as string,
    status: formData.get('status') as string,
    due_date: formData.get('due_date') as string,
    notes: (formData.get('notes') as string) || null,
  }

  if (orderNumber) {
    createPayload.order_number = orderNumber
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert(createPayload)
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
  const orderNumber = (formData.get('order_number') as string)?.trim() || null

  const updatePayload: {
    customer_id: string
    order_number?: string
    status: string
    due_date: string
    notes: string | null
  } = {
    customer_id: formData.get('customer_id') as string,
    status: formData.get('status') as string,
    due_date: formData.get('due_date') as string,
    notes: (formData.get('notes') as string) || null,
  }

  if (orderNumber) {
    updatePayload.order_number = orderNumber
  }

  await supabase
    .from('orders')
    .update(updatePayload)
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
