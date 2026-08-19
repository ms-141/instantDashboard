'use client'

import Link from 'next/link'
import { createAutomation, updateAutomation, deleteAutomation } from '@/app/actions/automations'
import DeleteButton from '@/components/DeleteButton'
import type { EmailAutomation, EmailTemplate, OrderStatus } from '@/types'

interface Props {
  automation?: EmailAutomation
  templates: EmailTemplate[]
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AutomationForm({ automation, templates }: Props) {
  const action = automation
    ? updateAutomation.bind(null, automation.id)
    : createAutomation

  return (
    <form action={action} className="max-w-lg space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Automation Name *</label>
          <input type="text" name="name" required defaultValue={automation?.name}
            placeholder="e.g. Order ready notification"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">When order status changes to *</label>
          <select name="trigger_status" required defaultValue={automation?.trigger_status ?? 'completed'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Send template *</label>
          <select name="template_id" required defaultValue={automation?.template_id}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="" disabled>Select a template…</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {!templates.length && (
            <p className="text-xs text-amber-600 mt-2">
              No templates yet — <Link href="/email-templates/new" className="underline">create one first</Link>.
            </p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="enabled" defaultChecked={automation?.enabled ?? true} />
          Enabled
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          {automation ? 'Update Automation' : 'Create Automation'}
        </button>
        <Link href="/automations"
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
          Cancel
        </Link>
        {automation && (
          <DeleteButton
            action={deleteAutomation.bind(null, automation.id)}
            message="Delete this automation?"
            className="ml-auto bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          />
        )}
      </div>
    </form>
  )
}
