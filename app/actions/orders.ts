'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function asText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

async function ensureCustomerId(params: {
  customerId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  customerNotes: string | null
}) {
  if (params.customerId) {
    return params.customerId
  }

  if (!params.customerName) {
    throw new Error('Customer is required')
  }

  const supabase = await createClient()

  const { data: existingCustomer, error: lookupError } = await supabase
    .from('customers')
    .select('id')
    .ilike('name', params.customerName)
    .maybeSingle()

  if (lookupError) throw new Error(lookupError.message)
  if (existingCustomer?.id) return existingCustomer.id

  const { data: createdCustomer, error: createError } = await supabase
    .from('customers')
    .insert({
      name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
      notes: params.customerNotes,
    })
    .select('id')
    .single()

  if (createError) throw new Error(createError.message)
  return createdCustomer.id
}

export async function createOrder(formData: FormData) {
  const supabase = await createClient()
  const orderNumber = (formData.get('order_number') as string)?.trim() || null
  const customerId = await ensureCustomerId({
    customerId: asText(formData.get('customer_id')),
    customerName: asText(formData.get('customer_name')),
    customerEmail: asText(formData.get('customer_email')),
    customerPhone: asText(formData.get('customer_phone')),
    customerNotes: asText(formData.get('customer_notes')),
  })

  const createPayload: {
    customer_id: string
    order_number?: string
    status: string
    due_date: string
    notes: string | null
  } = {
    customer_id: customerId,
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

export async function markOrderCompleted(orderId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ status: 'completed' })
    .eq('id', orderId)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
}
