import { createClient } from '@/utils/supabase/server'
import EmailTemplateForm from '@/components/EmailTemplateForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditEmailTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: template } = await supabase.from('email_templates').select('*').eq('id', id).single()
  if (!template) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/email-templates" className="text-gray-400 hover:text-gray-600 text-sm">← Templates</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Template</h1>
      <EmailTemplateForm template={template} />
    </div>
  )
}
