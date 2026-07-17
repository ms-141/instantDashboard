'use client'

import { useState } from 'react'
import type { Customer, Order, OrderLogo, OrderGarment } from '@/types'

const PLACEMENTS = [
  'Left Chest', 'Right Chest', 'Center Chest', 'Back', 'Upper Back',
  'Left Sleeve', 'Right Sleeve', 'Hat Front', 'Hat Side', 'Collar', 'Cuff', 'Other',
]
const GARMENT_TYPES = [
  'Polo', 'T-Shirt', 'Dress Shirt', 'Hoodie', 'Sweatshirt',
  'Jacket', 'Hat/Cap', 'Vest', 'Pants', 'Shorts', 'Other',
]

type LogoField = Omit<OrderLogo, 'id' | 'order_id'>
type GarmentField = Omit<OrderGarment, 'id' | 'order_id'>

const emptyLogo = (): LogoField => ({
  name: null, width_inches: 0, height_inches: 0, placement: 'Left Chest', notes: null,
})
const emptyGarment = (): GarmentField => ({
  garment_type: 'Polo', quantity: 1, color: null, sizes: null, supplied_by: 'customer', notes: null,
})

interface Props {
  customers: Customer[]
  action: (fd: FormData) => Promise<void>
  order?: Order & { logos: OrderLogo[]; garments: OrderGarment[] }
}

export default function OrderForm({ customers, action, order }: Props) {
  const [logos, setLogos] = useState<LogoField[]>(
    order?.logos?.map(({ name, width_inches, height_inches, placement, notes }) =>
      ({ name, width_inches, height_inches, placement, notes })) ?? [emptyLogo()]
  )
  const [garments, setGarments] = useState<GarmentField[]>(
    order?.garments?.map(({ garment_type, quantity, color, sizes, supplied_by, notes }) =>
      ({ garment_type, quantity, color, sizes, supplied_by, notes })) ?? [emptyGarment()]
  )

  const updateLogo = (i: number, field: keyof LogoField, value: unknown) =>
    setLogos(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))

  const updateGarment = (i: number, field: keyof GarmentField, value: unknown) =>
    setGarments(prev => prev.map((g, idx) => idx === i ? { ...g, [field]: value } : g))

  return (
    <form action={action} className="space-y-6 max-w-3xl">
      {/* Pass JSON state as hidden inputs */}
      <input type="hidden" name="logos" value={JSON.stringify(logos)} />
      <input type="hidden" name="garments" value={JSON.stringify(garments)} />

      {/* Order details */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Order Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
            <select name="customer_id" required defaultValue={order?.customer_id ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
            <input type="text" name="order_number" defaultValue={order?.order_number ?? ''}
              placeholder="Leave blank to auto-generate"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select name="status" required defaultValue={order?.status ?? 'new'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input type="date" name="due_date" required defaultValue={order?.due_date ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" rows={2} defaultValue={order?.notes ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Logos</h2>
          <button type="button" onClick={() => setLogos(p => [...p, emptyLogo()])}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            + Add Logo
          </button>
        </div>
        {logos.map((logo, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-4 mb-3 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-600">Logo {i + 1}</span>
              {logos.length > 1 && (
                <button type="button" onClick={() => setLogos(p => p.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-400 hover:text-red-600">Remove</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name / Description</label>
                <input type="text" value={logo.name ?? ''} onChange={e => updateLogo(i, 'name', e.target.value || null)}
                  placeholder="e.g. Company Logo"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Placement *</label>
                <select value={logo.placement} onChange={e => updateLogo(i, 'placement', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {PLACEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Width (inches) *</label>
                <input type="number" step="0.25" min="0.25"
                  value={logo.width_inches || ''}
                  onChange={e => updateLogo(i, 'width_inches', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Height (inches) *</label>
                <input type="number" step="0.25" min="0.25"
                  value={logo.height_inches || ''}
                  onChange={e => updateLogo(i, 'height_inches', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input type="text" value={logo.notes ?? ''} onChange={e => updateLogo(i, 'notes', e.target.value || null)}
                  placeholder="e.g. stitch count, thread colors…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Garments */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Garments</h2>
          <button type="button" onClick={() => setGarments(p => [...p, emptyGarment()])}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            + Add Garment
          </button>
        </div>
        {garments.map((g, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-4 mb-3 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-600">Garment {i + 1}</span>
              {garments.length > 1 && (
                <button type="button" onClick={() => setGarments(p => p.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-400 hover:text-red-600">Remove</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                <select value={g.garment_type} onChange={e => updateGarment(i, 'garment_type', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {GARMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supplied By</label>
                <select value={g.supplied_by} onChange={e => updateGarment(i, 'supplied_by', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="customer">Customer</option>
                  <option value="us">Us</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                <input type="number" min="1" value={g.quantity}
                  onChange={e => updateGarment(i, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                <input type="text" value={g.color ?? ''} onChange={e => updateGarment(i, 'color', e.target.value || null)}
                  placeholder="e.g. Navy Blue"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Sizes</label>
                <input type="text" value={g.sizes ?? ''} onChange={e => updateGarment(i, 'sizes', e.target.value || null)}
                  placeholder="e.g. S×2, M×4, L×3, XL×1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input type="text" value={g.notes ?? ''} onChange={e => updateGarment(i, 'notes', e.target.value || null)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="flex gap-3">
        <button type="submit"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          {order ? 'Update Order' : 'Create Order'}
        </button>
        <a href={order ? `/orders/${order.id}` : '/orders'}
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
          Cancel
        </a>
      </div>
    </form>
  )
}
