'use client'

import { useRef } from 'react'
import { addNote } from '@/app/actions/emails'

interface Props {
  customerId: string
  orderId?: string | null
}

export default function AddNoteForm({ customerId, orderId }: Props) {
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    await addNote(formData)
    formRef.current?.reset()
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-2 px-6 py-4 border-b border-gray-50">
      <input type="hidden" name="customer_id" value={customerId} />
      {orderId && <input type="hidden" name="order_id" value={orderId} />}
      <input
        type="text"
        name="note"
        required
        placeholder="Add a note…"
        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors shrink-0"
      >
        Add Note
      </button>
    </form>
  )
}
