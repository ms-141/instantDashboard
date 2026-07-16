'use client'

import { submitImportReview } from '@/app/actions/imports'
import type { ImportedOrder } from '@/types'

const ORDER_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

type Props = {
  importedOrder: ImportedOrder
}

export default function ImportReviewForm({ importedOrder }: Props) {
  const submitReview = submitImportReview.bind(null, importedOrder.id)

  const logosJson = JSON.stringify(importedOrder.logos ?? [], null, 2)
  const garmentsJson = JSON.stringify(importedOrder.garments ?? [], null, 2)

  return (
    <form action={submitReview} className="space-y-6 max-w-4xl">
      <section className="bg-white rounded-xl border border-gray-100 p-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
          <input
            name="customer_name"
            required
            defaultValue={importedOrder.customer_name}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
          <input
            name="customer_email"
            type="email"
            defaultValue={importedOrder.customer_email ?? ''}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
          <input
            name="customer_phone"
            defaultValue={importedOrder.customer_phone ?? ''}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
          <input
            name="order_number"
            defaultValue={importedOrder.order_number ?? ''}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (required for approval)</label>
          <input
            name="due_date"
            type="date"
            defaultValue={importedOrder.due_date ?? ''}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
          <select
            name="order_status"
            defaultValue={importedOrder.order_status}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {ORDER_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={importedOrder.notes ?? ''}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Notes</label>
          <textarea
            name="customer_notes"
            rows={2}
            defaultValue={importedOrder.customer_notes ?? ''}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logos (JSON array)
          </label>
          <textarea
            name="logos_json"
            rows={8}
            defaultValue={logosJson}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Garments (JSON array)
          </label>
          <textarea
            name="garments_json"
            rows={8}
            defaultValue={garmentsJson}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
        <textarea
          name="review_notes"
          rows={2}
          defaultValue={importedOrder.review_notes ?? ''}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          name="intent"
          value="save"
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          Save Draft
        </button>
        <button
          type="submit"
          name="intent"
          value="approve"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Approve & Create Order
        </button>
        <button
          type="submit"
          name="intent"
          value="reject"
          className="text-red-600 text-sm font-medium hover:text-red-700"
        >
          Reject Import
        </button>
      </div>
    </form>
  )
}
