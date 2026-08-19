import type { Customer, Order } from '@/types'

export type MergeFields = Record<string, string>

/**
 * Replaces {{merge_field}} placeholders (whitespace-tolerant, case-insensitive)
 * with values from `fields`. Unknown placeholders are left as-is so a typo'd
 * field name is easy to spot instead of silently disappearing.
 */
export function renderTemplate(text: string, fields: MergeFields): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, rawKey: string) => {
    const key = rawKey.toLowerCase()
    const value = Object.prototype.hasOwnProperty.call(fields, key) ? fields[key] : undefined
    return value !== undefined ? value : match
  })
}

function formatDate(d: string | null | undefined) {
  if (!d) return ''
  return new Date(`${d}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

/** Builds the merge-field map available to templates for a given customer/order. */
export function buildMergeFields(customer: Customer, order?: Order | null): MergeFields {
  return {
    customer_name: customer.name || '',
    company_name: customer.name || '',
    contact_name: customer.contact_name || customer.name || '',
    customer_email: customer.email || '',
    customer_phone: customer.phone || '',
    order_number: order?.order_number || '',
    order_status: order?.status || '',
    due_date: formatDate(order?.due_date),
  }
}

export const AVAILABLE_MERGE_FIELDS = [
  'customer_name',
  'contact_name',
  'customer_email',
  'customer_phone',
  'order_number',
  'order_status',
  'due_date',
] as const
