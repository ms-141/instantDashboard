'use client'

import Link from 'next/link'
import { createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/app/actions/emails'
import DeleteButton from '@/components/DeleteButton'
import { AVAILABLE_MERGE_FIELDS } from '@/lib/emailTemplate'
import type { EmailTemplate } from '@/types'

interface Props {
  template?: EmailTemplate
}

export default function EmailTemplateForm({ template }: Props) {
  const action = template
    ? updateEmailTemplate.bind(null, template.id)
    : createEmailTemplate

  return (
    <form action={action} className="max-w-2xl space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
          <input type="text" name="name" required defaultValue={template?.name}
            placeholder="e.g. Order Ready for Pickup"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
          <input type="text" name="subject" required defaultValue={template?.subject}
            placeholder="Your order {{order_number}} is ready!"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body (HTML) *</label>
          <textarea name="body_html" rows={12} required defaultValue={template?.body_html}
            placeholder={`Hi {{contact_name}},\n\nYour order {{order_number}} is ready for pickup!`}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <p className="text-xs text-gray-400 mt-2">
            Available merge fields: {AVAILABLE_MERGE_FIELDS.map(f => `{{${f}}}`).join(', ')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          {template ? 'Update Template' : 'Create Template'}
        </button>
        <Link href="/email-templates"
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
          Cancel
        </Link>
        {template && (
          <DeleteButton
            action={deleteEmailTemplate.bind(null, template.id)}
            message="Delete this template? Automations using it will stop working."
            className="ml-auto bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          />
        )}
      </div>
    </form>
  )
}
