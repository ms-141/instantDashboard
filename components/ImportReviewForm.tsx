'use client'

import { useState } from 'react'
import { submitImportReview } from '@/app/actions/imports'
import type { Customer, ImportedOrder, ImportedGarment, ImportedLogo } from '@/types'
import { uploadLogoImage } from '@/utils/supabase/logoUploads'
import GarmentSizesEditor from '@/components/GarmentSizesEditor'
import { createEmptyGarmentSizes, parseGarmentSizes, serializeGarmentSizes, type GarmentSizeRow } from '@/utils/garmentSizes'

const PLACEMENTS = [
  'Left Chest', 'Right Chest', 'Center Chest', 'Back', 'Upper Back',
  'Left Sleeve', 'Right Sleeve', 'Hat Front', 'Hat Side', 'Collar', 'Cuff', 'Other',
]
const GARMENT_TYPES = [
  'Polo', 'T-Shirt', 'Dress Shirt', 'Hoodie', 'Sweatshirt',
  'Jacket', 'Hat/Cap', 'Vest', 'Pants', 'Shorts', 'Other',
]

const ORDER_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

type Props = {
  importedOrder: ImportedOrder
  customers: Customer[]
}

const emptyLogo = (): ImportedLogo => ({
  name: null,
  image_path: null,
  image_url: null,
  price: null,
  width_inches: 0,
  height_inches: 0,
  placement: 'Left Chest',
  notes: null,
})

const emptyGarment = (): GarmentField => ({
  garment_type: 'Polo',
  quantity: 1,
  price: null,
  color: null,
  sizes: createEmptyGarmentSizes(),
  supplied_by: 'customer',
  notes: null,
})

type GarmentField = Omit<ImportedGarment, 'sizes'> & {
  sizes: GarmentSizeRow[]
}

function normalizeGarment(garment: ImportedGarment): GarmentField {
  return {
    ...garment,
    sizes: parseGarmentSizes(garment.sizes),
  }
}

export default function ImportReviewForm({ importedOrder, customers }: Props) {
  const submitReview = submitImportReview.bind(null, importedOrder.id)
  const [logos, setLogos] = useState<ImportedLogo[]>(importedOrder.logos ?? [emptyLogo()])
  const [garments, setGarments] = useState<GarmentField[]>(
    importedOrder.garments?.length
      ? importedOrder.garments.map(normalizeGarment)
      : [emptyGarment()]
  )
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    const customerEmail = importedOrder.customer_email?.trim().toLowerCase()
    const customerName = importedOrder.customer_name.trim().toLowerCase()
    const emailMatch = customerEmail
      ? customers.find(customer => customer.email?.trim().toLowerCase() === customerEmail)
      : null
    if (emailMatch) return emailMatch.id

    const nameMatch = customers.find(
      customer => customer.name.trim().toLowerCase() === customerName
    )
    return nameMatch?.id ?? ''
  })
  const [uploadingLogoIndex, setUploadingLogoIndex] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [contactName, setContactName] = useState(() => importedOrder.contact_name ?? '')

  const updateLogo = (i: number, field: keyof ImportedLogo, value: unknown) =>
    setLogos(prev => prev.map((logo, idx) => (idx === i ? { ...logo, [field]: value } : logo)))

  const updateGarment = (i: number, field: keyof GarmentField, value: unknown) =>
    setGarments(prev =>
      prev.map((garment, idx) => (idx === i ? { ...garment, [field]: value } : garment))
    )

  const onLogoImageChange = async (i: number, file: File | null) => {
    if (!file) return

    setUploadError(null)
    setUploadingLogoIndex(i)

    try {
      const uploaded = await uploadLogoImage(file, 'imports')
      setLogos(prev => prev.map((logo, idx) => (idx === i ? { ...logo, ...uploaded } : logo)))
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image.')
    } finally {
      setUploadingLogoIndex(null)
    }
  }

  return (
    <form action={submitReview} className="space-y-6 max-w-3xl">
      <input type="hidden" name="existing_customer_id" value={selectedCustomerId} />
      <input type="hidden" name="logos_json" value={JSON.stringify(logos)} />
      <input
        type="hidden"
        name="garments_json"
        value={JSON.stringify(garments.map(garment => ({
          ...garment,
          sizes: serializeGarmentSizes(garment.sizes),
        })))}
      />
      {uploadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {uploadError}
        </div>
      )}

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Order Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input
              name="customer_name"
              required
              defaultValue={importedOrder.customer_name}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
            <input
              name="order_number"
              defaultValue={importedOrder.order_number ?? ''}
              placeholder="Leave blank to auto-generate"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
            <input
              name="customer_email"
              type="email"
              defaultValue={importedOrder.customer_email ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
            <input
              name="contact_name"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="Optional person name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Phone</label>
            <input
              name="customer_phone"
              defaultValue={importedOrder.customer_phone ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <label className="block text-sm font-medium text-amber-900 mb-1">Existing Company Match</label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">Create or auto-match from the typed company details</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.email ? ` · ${customer.email}` : ''}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-amber-800">
              Use this when the import should attach to an existing company even if the typed details vary slightly.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Status *</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input
              name="due_date"
              type="date"
              defaultValue={importedOrder.due_date ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={importedOrder.notes ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Notes</label>
            <textarea
              name="customer_notes"
              rows={2}
              defaultValue={importedOrder.customer_notes ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Logos</h2>
          <button
            type="button"
            onClick={() => setLogos(prev => [...prev, emptyLogo()])}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Add Logo
          </button>
        </div>
        {logos.map((logo, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-4 mb-3 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-600">Logo {i + 1}</span>
              {logos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLogos(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name / Description</label>
                <input
                  type="text"
                  value={logo.name ?? ''}
                  onChange={e => updateLogo(i, 'name', e.target.value || null)}
                  placeholder="e.g. Company Logo"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Placement *</label>
                <select
                  value={logo.placement}
                  onChange={e => updateLogo(i, 'placement', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PLACEMENTS.map(placement => (
                    <option key={placement} value={placement}>
                      {placement}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={logo.price ?? ''}
                  onChange={e => updateLogo(i, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g. 25.00"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Width (inches) *</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={logo.width_inches || ''}
                  onChange={e => updateLogo(i, 'width_inches', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Height (inches) *</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={logo.height_inches || ''}
                  onChange={e => updateLogo(i, 'height_inches', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Logo Image</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={e => onLogoImageChange(i, e.target.files?.[0] ?? null)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-indigo-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-indigo-700"
                />
                {logo.image_url && (
                  <img
                    src={logo.image_url}
                    alt={logo.name ? `${logo.name} preview` : `Logo ${i + 1} preview`}
                    className="mt-2 h-20 w-20 rounded-md border border-gray-200 object-cover"
                  />
                )}
                {uploadingLogoIndex === i && (
                  <p className="mt-1 text-xs text-gray-500">Uploading image...</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={logo.notes ?? ''}
                  onChange={e => updateLogo(i, 'notes', e.target.value || null)}
                  placeholder="e.g. stitch count, thread colors..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Garments</h2>
          <button
            type="button"
            onClick={() => setGarments(prev => [...prev, emptyGarment()])}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Add Garment
          </button>
        </div>
        {garments.map((garment, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-4 mb-3 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-600">Garment {i + 1}</span>
              {garments.length > 1 && (
                <button
                  type="button"
                  onClick={() => setGarments(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                <select
                  value={garment.garment_type}
                  onChange={e => updateGarment(i, 'garment_type', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {GARMENT_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supplied By</label>
                <select
                  value={garment.supplied_by}
                  onChange={e => updateGarment(i, 'supplied_by', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="customer">Customer</option>
                  <option value="us">Us</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={garment.quantity || ''}
                  onChange={e => updateGarment(i, 'quantity', e.target.value ? parseInt(e.target.value, 10) : 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                <input
                  type="text"
                  value={garment.color ?? ''}
                  onChange={e => updateGarment(i, 'color', e.target.value || null)}
                  placeholder="e.g. Navy Blue"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={garment.price ?? ''}
                  onChange={e => updateGarment(i, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g. 12.50"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Sizes</label>
                <GarmentSizesEditor
                  value={garment.sizes}
                  onChange={nextSizes => updateGarment(i, 'sizes', nextSizes)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={garment.notes ?? ''}
                  onChange={e => updateGarment(i, 'notes', e.target.value || null)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
          disabled={uploadingLogoIndex !== null}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          Save Draft
        </button>
        <button
          type="submit"
          name="intent"
          value="approve"
          disabled={uploadingLogoIndex !== null}
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
