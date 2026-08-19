import { createClient } from '@/utils/supabase/server'
import AutomationForm from '@/components/AutomationForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditAutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: automation }, { data: templates }] = await Promise.all([
    supabase.from('email_automations').select('*').eq('id', id).single(),
    supabase.from('email_templates').select('*').order('name', { ascending: true }),
  ])

  if (!automation) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/automations" className="text-gray-400 hover:text-gray-600 text-sm">← Automations</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Automation</h1>
      <AutomationForm automation={automation} templates={templates ?? []} />
    </div>
  )
}
