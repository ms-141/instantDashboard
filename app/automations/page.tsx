import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import AutomationToggle from '@/components/AutomationToggle'
import StatusBadge from '@/components/StatusBadge'

export default async function AutomationsPage() {
  const supabase = await createClient()
  const { data: automations } = await supabase
    .from('email_automations')
    .select('*, template:email_templates(*)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
          <p className="text-sm text-gray-500 mt-1">Automatically email a customer when an order&apos;s status changes.</p>
        </div>
        <Link href="/automations/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + New Automation
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {!automations?.length ? (
          <p className="text-gray-400 text-sm px-6 py-10 text-center">
            No automations yet.{' '}
            <Link href="/automations/new" className="text-indigo-600 hover:underline">Create one?</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Trigger</th>
                  <th className="px-6 py-3 font-medium">Template</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {automations.map(a => (
                  <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/automations/${a.id}`} className="text-indigo-600 hover:underline font-medium">
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      Status → <StatusBadge status={a.trigger_status} />
                    </td>
                    <td className="px-6 py-3 text-gray-600">{a.template?.name ?? '—'}</td>
                    <td className="px-6 py-3">
                      <AutomationToggle id={a.id} enabled={a.enabled} />
                    </td>
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
