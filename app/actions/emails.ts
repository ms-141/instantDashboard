'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { randomUUID } from 'crypto'
import { getMailer, getEmailFromAddress } from '@/utils/mailer'
import { prepareTrackableHtml } from '@/lib/emailTracking'
import { buildMergeFields, renderTemplate } from '@/lib/emailTemplate'
import type { EmailStatus, Order } from '@/types'

function asText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Core send routine: creates the email_messages row, injects the open
 * tracking pixel + click-tracked links, sends via Gmail SMTP (authenticated
 * as the real instant@telus.net mailbox), and logs the result to the
 * customer's activity timeline. Used both by the "Send Email" form action
 * below and by the order-status automation hook in app/actions/orders.ts.
 */
export async function sendEmail(params: {
  customerId: string
  orderId?: string | null
  templateId?: string | null
  automationId?: string | null
  subject: string
  bodyHtml: string
}): Promise<{ id: string; status: EmailStatus }> {
  const supabase = await createClient()

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.customerId)
    .single()

  if (customerError || !customer) throw new Error('Customer not found')
  if (!customer.email) throw new Error(`${customer.name} has no email address on file`)

  let order: Order | null = null
  if (params.orderId) {
    const { data } = await supabase.from('orders').select('*').eq('id', params.orderId).single()
    order = data
  }

  // Render any remaining {{merge_field}} placeholders (from a template or
  // typed in manually) with live customer/order data before sending.
  const mergeFields = buildMergeFields(customer, order)
  const subject = renderTemplate(params.subject, mergeFields)
  const bodyHtml = renderTemplate(params.bodyHtml, mergeFields)

  const trackingId = randomUUID()
  const fromEmail = getEmailFromAddress()

  const { data: message, error: insertError } = await supabase
    .from('email_messages')
    .insert({
      tracking_id: trackingId,
      customer_id: params.customerId,
      order_id: params.orderId || null,
      template_id: params.templateId || null,
      automation_id: params.automationId || null,
      to_email: customer.email,
      from_email: fromEmail,
      subject,
      body_html: bodyHtml,
      status: 'queued',
    })
    .select()
    .single()

  if (insertError || !message) throw new Error(insertError?.message || 'Failed to create email record')

  const trackableHtml = prepareTrackableHtml(bodyHtml, trackingId)

  try {
    const mailer = getMailer()
    const sendResult = await mailer.sendMail({
      from: fromEmail,
      to: customer.email,
      subject,
      html: trackableHtml,
    })

    await supabase
      .from('email_messages')
      .update({
        status: 'sent',
        provider_message_id: sendResult.messageId || null,
        sent_at: new Date().toISOString(),
      })
      .eq('id', message.id)

    await supabase.from('activity_events').insert({
      customer_id: params.customerId,
      order_id: params.orderId || null,
      email_message_id: message.id,
      type: 'email_sent',
      title: `Email sent: ${subject}`,
      description: `To ${customer.email}`,
    })

    revalidatePath(`/customers/${params.customerId}`)
    if (params.orderId) revalidatePath(`/orders/${params.orderId}`)

    return { id: message.id, status: 'sent' }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error sending email'

    await supabase
      .from('email_messages')
      .update({ status: 'failed', error_message: errorMessage })
      .eq('id', message.id)

    revalidatePath(`/customers/${params.customerId}`)
    if (params.orderId) revalidatePath(`/orders/${params.orderId}`)

    throw new Error(errorMessage)
  }
}

/** Form-bound wrapper around sendEmail for the "Send Email" UI. */
export async function sendEmailAction(formData: FormData) {
  const customerId = formData.get('customer_id') as string
  const orderId = asText(formData.get('order_id'))
  const templateId = asText(formData.get('template_id'))
  const subject = (formData.get('subject') as string) || ''
  const bodyHtml = (formData.get('body_html') as string) || ''

  await sendEmail({ customerId, orderId, templateId, subject, bodyHtml })
}

export async function addNote(formData: FormData) {
  const supabase = await createClient()
  const customerId = formData.get('customer_id') as string
  const orderId = asText(formData.get('order_id'))
  const note = (formData.get('note') as string)?.trim()

  if (!note) throw new Error('Note text is required')

  await supabase.from('activity_events').insert({
    customer_id: customerId,
    order_id: orderId,
    type: 'note_added',
    title: 'Note added',
    description: note,
  })

  revalidatePath(`/customers/${customerId}`)
  if (orderId) revalidatePath(`/orders/${orderId}`)
}

export async function createEmailTemplate(formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_templates')
    .insert({
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      body_html: formData.get('body_html') as string,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/email-templates')
  redirect(`/email-templates/${data.id}`)
}

export async function updateEmailTemplate(templateId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('email_templates')
    .update({
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      body_html: formData.get('body_html') as string,
    })
    .eq('id', templateId)

  if (error) throw new Error(error.message)

  revalidatePath('/email-templates')
  revalidatePath(`/email-templates/${templateId}`)
  redirect(`/email-templates/${templateId}`)
}

export async function deleteEmailTemplate(templateId: string) {
  const supabase = await createClient()
  await supabase.from('email_templates').delete().eq('id', templateId)
  revalidatePath('/email-templates')
  redirect('/email-templates')
}
