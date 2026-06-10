'use client'

import type { Customer } from '@/types'
import { createCustomer, updateCustomer } from '@/app/actions/customers'

interface Props {
  customer?: Customer
}

export default function CustomerForm({ customer }: Props) {
  const action = customer
    ? updateCustomer.bind(null, customer.id)
    : createCustomer

  return (
    <form action={action} className="max-w-lg space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input type="text" name="name" required defaultValue={customer?.name}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" name="email" defaultValue={customer?.email ?? ''}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" name="phone" defaultValue={customer?.phone ?? ''}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea name="notes" rows={3} defaultValue={customer?.notes ?? ''}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          {customer ? 'Update Customer' : 'Create Customer'}
        </button>
        <a href={customer ? `/customers/${customer.id}` : '/customers'}
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
          Cancel
        </a>
      </div>
    </form>
  )
}
