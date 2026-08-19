import { createClient } from '@/utils/supabase/server'
import AutomationForm from '@/components/AutomationForm'

export default async function NewAutomationPage() {
  const supabase = await createClient()
  const { data: templates } = await supabase.from('email_templates').select('*').order('name', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Automation</h1>
      <AutomationForm templates={templates ?? []} />
    </div>
  )
}
