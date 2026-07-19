import { createAdminClient } from '@/utils/supabase/admin'
import type { OrderStatus, SuppliedBy } from '@/types'

type InboundLogo = {
  name?: string
  price?: number
  width_inches?: number
  height_inches?: number
  placement?: string
  notes?: string
}

type InboundGarment = {
  garment_type?: string
  quantity?: number
  price?: number
  color?: string
  sizes?: string
  supplied_by?: SuppliedBy
  notes?: string
}

type InboundOrderPayload = {
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  customer_notes?: string
  order_number?: string
  status?: OrderStatus
  due_date?: string
  notes?: string
  logos?: InboundLogo[]
  garments?: InboundGarment[]
  source_identifier?: string
}

const VALID_STATUSES: OrderStatus[] = ['new', 'in_progress', 'completed', 'delivered', 'cancelled']
const VALID_SUPPLIED_BY: SuppliedBy[] = ['customer', 'us']

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

function asText(value: unknown): string | null {
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

function parseLogos(logos: InboundLogo[] | undefined) {
  if (!Array.isArray(logos)) return []
  return logos
    .filter(logo => {
      return (
        typeof logo.width_inches === 'number' &&
        logo.width_inches > 0 &&
        typeof logo.height_inches === 'number' &&
        logo.height_inches > 0 &&
        typeof logo.placement === 'string' &&
        logo.placement.trim().length > 0
      )
    })
    .map(logo => ({
      name: asText(logo.name),
      price: typeof logo.price === 'number' && logo.price >= 0 ? logo.price : null,
      width_inches: logo.width_inches as number,
      height_inches: logo.height_inches as number,
      placement: asText(logo.placement) as string,
      notes: asText(logo.notes),
    }))
}

function parseGarments(garments: InboundGarment[] | undefined) {
  if (!Array.isArray(garments)) return []
  return garments
    .filter(garment => {
      return (
        typeof garment.garment_type === 'string' &&
        garment.garment_type.trim().length > 0 &&
        typeof garment.quantity === 'number' &&
        garment.quantity > 0
      )
    })
    .map(garment => ({
      garment_type: asText(garment.garment_type) as string,
      quantity: garment.quantity as number,
      price: typeof garment.price === 'number' && garment.price >= 0 ? garment.price : null,
      color: asText(garment.color),
      sizes: asText(garment.sizes),
      supplied_by:
        garment.supplied_by && VALID_SUPPLIED_BY.includes(garment.supplied_by)
          ? garment.supplied_by
          : 'customer',
      notes: asText(garment.notes),
    }))
}

export async function POST(request: Request) {
  const expectedSecret = process.env.INBOUND_ORDER_WEBHOOK_SECRET
  if (!expectedSecret) {
    return jsonError('Server missing INBOUND_ORDER_WEBHOOK_SECRET', 500)
  }

  const incomingSecret = request.headers.get('x-inbound-order-secret')
  if (incomingSecret !== expectedSecret) {
    return jsonError('Unauthorized', 401)
  }

  const payload = (await request.json()) as InboundOrderPayload
  const customerName = asText(payload.customer_name)
  if (!customerName) {
    return jsonError('customer_name is required')
  }

  const orderStatus =
    payload.status && VALID_STATUSES.includes(payload.status) ? payload.status : 'new'
  const dueDate = asDate(asText(payload.due_date))
  if (payload.due_date && !dueDate) {
    return jsonError('due_date must be YYYY-MM-DD when provided')
  }

  const admin = createAdminClient()
  const logos = parseLogos(payload.logos)
  const garments = parseGarments(payload.garments)

  const { data: importedOrder, error } = await admin
    .from('imported_orders')
    .insert({
      source: 'email_webhook',
      source_identifier: asText(payload.source_identifier),
      review_status: 'pending',
      customer_name: customerName,
      customer_email: asText(payload.customer_email),
      customer_phone: asText(payload.customer_phone),
      customer_notes: asText(payload.customer_notes),
      order_number: asText(payload.order_number),
      order_status: orderStatus,
      due_date: dueDate,
      notes: asText(payload.notes),
      logos,
      garments,
      raw_payload: payload,
    })
    .select('id')
    .single()

  if (error) {
    return jsonError(error.message, 500)
  }

  return Response.json(
    {
      success: true,
      import_id: importedOrder.id,
      review_url: '/imports',
    },
    { status: 201 }
  )
}
