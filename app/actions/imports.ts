'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { OrderStatus, SuppliedBy } from '@/types'

type ImportLogo = {
  name: string | null
  width_inches: number
  height_inches: number
  placement: string
  notes: string | null
}

type ImportGarment = {
  garment_type: string
  quantity: number
  color: string | null
  sizes: string | null
  supplied_by: SuppliedBy
  notes: string | null
}

const VALID_ORDER_STATUSES: OrderStatus[] = ['new', 'in_progress', 'completed', 'delivered', 'cancelled']
const VALID_SUPPLIED_BY: SuppliedBy[] = ['customer', 'us']

function asText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asDate(value: string | null): string | null {
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return value
}

function parseLogos(value: string | null): ImportLogo[] {
  if (!value) return []
  const parsed = JSON.parse(value) as unknown
  if (!Array.isArray(parsed)) {
    throw new Error('Logos must be a JSON array')
  }

  return parsed
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .filter(item => {
      return (
        typeof item.width_inches === 'number' &&
        item.width_inches > 0 &&
        typeof item.height_inches === 'number' &&
        item.height_inches > 0 &&
        typeof item.placement === 'string' &&
        item.placement.trim().length > 0
      )
    })
    .map(item => ({
      name: typeof item.name === 'string' && item.name.trim().length > 0 ? item.name.trim() : null,
      width_inches: item.width_inches as number,
      height_inches: item.height_inches as number,
      placement: (item.placement as string).trim(),
      notes: typeof item.notes === 'string' && item.notes.trim().length > 0 ? item.notes.trim() : null,
    }))
}

function parseGarments(value: string | null): ImportGarment[] {
  if (!value) return []
  const parsed = JSON.parse(value) as unknown
  if (!Array.isArray(parsed)) {
    throw new Error('Garments must be a JSON array')
  }

  return parsed
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .filter(item => {
      return (
        typeof item.garment_type === 'string' &&
        item.garment_type.trim().length > 0 &&
        typeof item.quantity === 'number' &&
        item.quantity > 0
      )
    })
    .map(item => ({
      garment_type: (item.garment_type as string).trim(),
      quantity: item.quantity as number,
      color: typeof item.color === 'string' && item.color.trim().length > 0 ? item.color.trim() : null,
      sizes: typeof item.sizes === 'string' && item.sizes.trim().length > 0 ? item.sizes.trim() : null,
      supplied_by:
        typeof item.supplied_by === 'string' &&
        VALID_SUPPLIED_BY.includes(item.supplied_by as SuppliedBy)
          ? (item.supplied_by as SuppliedBy)
          : 'customer',
      notes: typeof item.notes === 'string' && item.notes.trim().length > 0 ? item.notes.trim() : null,
    }))
}

async function ensureCustomerId(params: {
  name: string
  email: string | null
  phone: string | null
  notes: string | null
}): Promise<string> {
  const supabase = await createClient()

  if (params.email) {
    const { data: byEmail, error: byEmailError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', params.email)
      .maybeSingle()

    if (byEmailError) throw new Error(byEmailError.message)
    if (byEmail?.id) return byEmail.id
  }

  const { data: byName, error: byNameError } = await supabase
    .from('customers')
    .select('id')
    .eq('name', params.name)
    .maybeSingle()

  if (byNameError) throw new Error(byNameError.message)
  if (byName?.id) return byName.id

  const { data: created, error: createError } = await supabase
    .from('customers')
    .insert({
      name: params.name,
      email: params.email,
      phone: params.phone,
      notes: params.notes,
    })
    .select('id')
    .single()

  if (createError) throw new Error(createError.message)
  return created.id
}

export async function submitImportReview(importId: string, formData: FormData) {
  const intent = asText(formData.get('intent')) ?? 'save'
  const supabase = await createClient()

  if (intent === 'reject') {
    const { error: rejectError } = await supabase
      .from('imported_orders')
      .update({
        review_status: 'rejected',
        reviewed_at: new Date().toISOString(),
        review_notes: asText(formData.get('review_notes')),
      })
      .eq('id', importId)

    if (rejectError) throw new Error(rejectError.message)
    revalidatePath('/imports')
    redirect('/imports')
  }

  const customerName = asText(formData.get('customer_name'))
  if (!customerName) {
    throw new Error('Customer name is required')
  }

  const customerEmail = asText(formData.get('customer_email'))
  const customerPhone = asText(formData.get('customer_phone'))
  const customerNotes = asText(formData.get('customer_notes'))
  const orderNumber = asText(formData.get('order_number'))
  const dueDate = asDate(asText(formData.get('due_date')))
  const orderStatusRaw = asText(formData.get('order_status'))
  const orderStatus =
    orderStatusRaw && VALID_ORDER_STATUSES.includes(orderStatusRaw as OrderStatus)
      ? (orderStatusRaw as OrderStatus)
      : 'new'
  const notes = asText(formData.get('notes'))
  const reviewNotes = asText(formData.get('review_notes'))
  const logos = parseLogos(asText(formData.get('logos_json')))
  const garments = parseGarments(asText(formData.get('garments_json')))

  const { error: saveError } = await supabase
    .from('imported_orders')
    .update({
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_notes: customerNotes,
      order_number: orderNumber,
      due_date: dueDate,
      order_status: orderStatus,
      notes,
      review_notes: reviewNotes,
      logos,
      garments,
    })
    .eq('id', importId)

  if (saveError) throw new Error(saveError.message)

  if (intent !== 'approve') {
    revalidatePath('/imports')
    revalidatePath(`/imports/${importId}`)
    redirect(`/imports/${importId}`)
  }

  if (!dueDate) {
    throw new Error('Due date is required before approval')
  }

  const customerId = await ensureCustomerId({
    name: customerName,
    email: customerEmail,
    phone: customerPhone,
    notes: customerNotes,
  })

  const { data: createdOrder, error: createOrderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      order_number: orderNumber,
      status: orderStatus,
      due_date: dueDate,
      notes,
    })
    .select('id')
    .single()

  if (createOrderError) throw new Error(createOrderError.message)

  if (logos.length > 0) {
    const { error: logosError } = await supabase
      .from('order_logos')
      .insert(logos.map(logo => ({ ...logo, order_id: createdOrder.id })))

    if (logosError) throw new Error(logosError.message)
  }

  if (garments.length > 0) {
    const { error: garmentsError } = await supabase
      .from('order_garments')
      .insert(garments.map(garment => ({ ...garment, order_id: createdOrder.id })))

    if (garmentsError) throw new Error(garmentsError.message)
  }

  const { error: approveError } = await supabase
    .from('imported_orders')
    .update({
      review_status: 'approved',
      reviewed_at: new Date().toISOString(),
      approved_order_id: createdOrder.id,
      review_notes: reviewNotes,
    })
    .eq('id', importId)

  if (approveError) throw new Error(approveError.message)

  revalidatePath('/')
  revalidatePath('/orders')
  revalidatePath('/imports')
  redirect(`/orders/${createdOrder.id}`)
}
