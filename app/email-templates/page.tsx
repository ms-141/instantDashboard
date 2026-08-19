import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function EmailTemplatesPage() {
  const supabase = await createClient()
  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
        <Link href="/email-templates/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + New Template
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {!templates?.length ? (
          <p className="text-gray-400 text-sm px-6 py-10 text-center">
            No templates yet.{' '}
            <Link href="/email-templates/new" className="text-indigo-600 hover:underline">Create one?</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Subject</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(t => (
                  <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/email-templates/${t.id}`} className="text-indigo-600 hover:underline font-medium">
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{t.subject}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
