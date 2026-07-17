import { createAdminClient } from '@/utils/supabase/admin'
import type { OrderStatus, SuppliedBy } from '@/types'

type InboundLogo = {
  name?: string
  width_inches?: number
  height_inches?: number
  placement?: string
  notes?: string
}

type InboundGarment = {
  garment_type?: string
  quantity?: number
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

type InboundOrderRequestPayload = InboundOrderPayload & {
  raw_email_text?: string
  email_subject?: string
  email_from?: string
  received_at?: string
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
      color: asText(garment.color),
      sizes: asText(garment.sizes),
      supplied_by:
        garment.supplied_by && VALID_SUPPLIED_BY.includes(garment.supplied_by)
          ? garment.supplied_by
          : 'customer',
      notes: asText(garment.notes),
    }))
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {}

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace < 0 || lastBrace <= firstBrace) return null

  try {
    const parsed = JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {}

  return null
}

async function extractWithOllama(params: {
  rawEmailText: string
  emailSubject: string | null
  emailFrom: string | null
}): Promise<InboundOrderPayload | null> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434'
  const model = process.env.OLLAMA_MODEL ?? 'gemma4:e2b'

  const prompt = [
    'Extract embroidery order details from this email.',
    'Return ONLY valid JSON with these keys when available:',
    '{',
    '  "customer_name": string,',
    '  "customer_email": string,',
    '  "customer_phone": string,',
    '  "customer_notes": string,',
    '  "order_number": string,',
    '  "status": "new" | "in_progress" | "completed" | "delivered" | "cancelled",',
    '  "due_date": "YYYY-MM-DD",',
    '  "notes": string,',
    '  "logos": [{"name": string, "width_inches": number, "height_inches": number, "placement": string, "notes": string}],',
    '  "garments": [{"garment_type": string, "quantity": number, "color": string, "sizes": string, "supplied_by": "customer" | "us", "notes": string}]',
    '}',
    'If unknown, omit fields. Do not include markdown fences.',
    '',
    `From: ${params.emailFrom ?? ''}`,
    `Subject: ${params.emailSubject ?? ''}`,
    'Body:',
    params.rawEmailText,
  ].join('\n')

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0,
      },
    }),
  })

  if (!response.ok) {
    return null
  }

  const generated = (await response.json()) as { response?: string }
  if (!generated.response) {
    return null
  }

  const extracted = extractJsonObject(generated.response)
  if (!extracted) {
    return null
  }

  return extracted as InboundOrderPayload
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

  const payload = (await request.json()) as InboundOrderRequestPayload
  const rawEmailText = asText(payload.raw_email_text)
  const extractedPayload =
    rawEmailText && !asText(payload.customer_name)
      ? await extractWithOllama({
          rawEmailText,
          emailSubject: asText(payload.email_subject),
          emailFrom: asText(payload.email_from),
        })
      : null

  const normalizedPayload: InboundOrderPayload = {
    ...payload,
    ...extractedPayload,
    logos: payload.logos ?? extractedPayload?.logos,
    garments: payload.garments ?? extractedPayload?.garments,
  }

  const customerName = asText(normalizedPayload.customer_name)
  if (!customerName) {
    return jsonError('customer_name is required (or provide raw_email_text for Ollama extraction)')
  }

  const orderStatus =
    normalizedPayload.status && VALID_STATUSES.includes(normalizedPayload.status)
      ? normalizedPayload.status
      : 'new'
  const dueDate = asDate(asText(normalizedPayload.due_date))
  if (normalizedPayload.due_date && !dueDate) {
    return jsonError('due_date must be YYYY-MM-DD when provided')
  }

  const admin = createAdminClient()
  const logos = parseLogos(normalizedPayload.logos)
  const garments = parseGarments(normalizedPayload.garments)

  const { data: importedOrder, error } = await admin
    .from('imported_orders')
    .insert({
      source: extractedPayload ? 'email_ollama_webhook' : 'email_webhook',
      source_identifier: asText(normalizedPayload.source_identifier),
      review_status: 'pending',
      customer_name: customerName,
      customer_email: asText(normalizedPayload.customer_email),
      customer_phone: asText(normalizedPayload.customer_phone),
      customer_notes: asText(normalizedPayload.customer_notes),
      order_number: asText(normalizedPayload.order_number),
      order_status: orderStatus,
      due_date: dueDate,
      notes: asText(normalizedPayload.notes),
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
