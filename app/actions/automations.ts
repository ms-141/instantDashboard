'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendEmail } from '@/app/actions/emails'
import { buildMergeFields, renderTemplate } from '@/lib/emailTemplate'
import type { Customer, Order, OrderStatus } from '@/types'

export async function createAutomation(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.from('email_automations').insert({
    name: formData.get('name') as string,
    trigger_status: formData.get('trigger_status') as string,
    template_id: formData.get('template_id') as string,
    enabled: formData.get('enabled') === 'on',
  })

  if (error) throw new Error(error.message)

  revalidatePath('/automations')
  redirect('/automations')
}

export async function updateAutomation(automationId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('email_automations')
    .update({
      name: formData.get('name') as string,
      trigger_status: formData.get('trigger_status') as string,
      template_id: formData.get('template_id') as string,
      enabled: formData.get('enabled') === 'on',
    })
    .eq('id', automationId)

  if (error) throw new Error(error.message)

  revalidatePath('/automations')
  redirect('/automations')
}

export async function toggleAutomation(automationId: string, enabled: boolean) {
  const supabase = await createClient()
  await supabase.from('email_automations').update({ enabled }).eq('id', automationId)
  revalidatePath('/automations')
}

export async function deleteAutomation(automationId: string) {
  const supabase = await createClient()
  await supabase.from('email_automations').delete().eq('id', automationId)
  revalidatePath('/automations')
  redirect('/automations')
}

/**
 * Called after an order's status is saved. Looks up any enabled automations
 * for the new status and sends the linked template to the order's customer.
 * Failures are logged but swallowed so a broken automation never blocks the
 * order save itself.
 */
export async function runStatusAutomations(orderId: string, newStatus: OrderStatus) {
  try {
    const supabase = await createClient()

    const { data: automations } = await supabase
      .from('email_automations')
      .select('*, template:email_templates(*)')
      .eq('trigger_status', newStatus)
      .eq('enabled', true)

    if (!automations?.length) return

    const { data: order } = await supabase
      .from('orders')
      .select('*, customer:customers(*)')
      .eq('id', orderId)
      .single()

    const customer = order?.customer as Customer | undefined
    if (!order || !customer) return

    const fields = buildMergeFields(customer, order as Order)

    for (const automation of automations) {
      const template = automation.template
      if (!template) continue

      try {
        await sendEmail({
          customerId: customer.id,
          orderId,
          templateId: template.id,
          automationId: automation.id,
          subject: renderTemplate(template.subject, fields),
          bodyHtml: renderTemplate(template.body_html, fields),
        })
      } catch (err) {
        console.error(`Automation "${automation.name}" failed to send:`, err)
      }
    }
  } catch (err) {
    console.error('runStatusAutomations failed:', err)
  }
}
