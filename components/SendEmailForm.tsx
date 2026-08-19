'use client'

import { useState } from 'react'
import { sendEmailAction } from '@/app/actions/emails'
import type { EmailTemplate } from '@/types'

interface Props {
  customerId: string
  orderId?: string | null
  customerEmail: string | null
  templates: EmailTemplate[]
}

export default function SendEmailForm({ customerId, orderId, customerEmail, templates }: Props) {
  const [open, setOpen] = useState(false)
  const [templateId, setTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!customerEmail}
        title={!customerEmail ? 'Add an email address for this company first' : undefined}
        className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ✉️ Send Email
      </button>
    )
  }

  function handleTemplateChange(id: string) {
    setTemplateId(id)
    const template = templates.find(t => t.id === id)
    if (template) {
      setSubject(template.subject)
      setBodyHtml(template.body_html)
    }
  }

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    try {
      await sendEmailAction(formData)
      setOpen(false)
      setTemplateId('')
      setSubject('')
      setBodyHtml('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg border border-gray-100 p-4 space-y-3 my-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Send Email to {customerEmail}</h3>
          <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">
            Cancel
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <form action={handleSubmit} className="space-y-3">
          <input type="hidden" name="customer_id" value={customerId} />
          {orderId && <input type="hidden" name="order_id" value={orderId} />}
          <input type="hidden" name="template_id" value={templateId} />

          {templates.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Template (optional)</label>
              <select
                value={templateId}
                onChange={e => handleTemplateChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Blank email</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
            <input
              type="text"
              name="subject"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Message (HTML supported — merge fields like {'{{customer_name}}'}, {'{{order_number}}'}, {'{{due_date}}'} are filled in automatically)
            </label>
            <textarea
              name="body_html"
              rows={8}
              required
              value={bodyHtml}
              onChange={e => setBodyHtml(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {pending ? 'Sending…' : 'Send Email'}
          </button>
        </form>
      </div>
    </div>
  )
}
