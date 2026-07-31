'use client'

import { useState } from 'react'
import type { Customer, Order, OrderGarment, OrderLogo } from '@/types'
import GarmentSizesEditor from '@/components/GarmentSizesEditor'
import { uploadLogoImage, uploadOrderIntakeFormImage } from '@/utils/supabase/logoUploads'
import {
  createEmptyGarmentSizes,
  parseGarmentSizes,
  serializeGarmentSizes,
  type GarmentSizeRow,
} from '@/utils/garmentSizes'

const PLACEMENTS = [
  'Left Chest', 'Right Chest', 'Center Chest', 'Back', 'Upper Back',
  'Left Sleeve', 'Right Sleeve', 'Hat Front', 'Hat Side', 'Collar', 'Cuff', 'Other',
]
const GARMENT_TYPES = [
  'Polo', 'T-Shirt', 'Dress Shirt', 'Hoodie', 'Sweatshirt',
  'Jacket', 'Hat/Cap', 'Vest', 'Pants', 'Shorts', 'Other',
]

type LogoField = Omit<OrderLogo, 'id' | 'order_id'>
type GarmentField = Omit<OrderGarment, 'id' | 'order_id' | 'sizes'> & {
  sizes: GarmentSizeRow[]
}

const emptyLogo = (): LogoField => ({
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

interface Props {
  customers: Customer[]
  action: (fd: FormData) => Promise<void>
  order?: Order & { logos: OrderLogo[]; garments: OrderGarment[] }
}

export default function OrderForm({ customers, action, order }: Props) {
  const [customerName, setCustomerName] = useState(() => order?.customer?.name ?? '')
  const [customerId, setCustomerId] = useState(order?.customer_id ?? '')
  const [contactName, setContactName] = useState(() => order?.customer?.contact_name ?? '')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [intakeFormImagePath, setIntakeFormImagePath] = useState(() => order?.intake_form_image_path ?? '')
  const [intakeFormImageUrl, setIntakeFormImageUrl] = useState(() => order?.intake_form_image_url ?? '')
  const [logos, setLogos] = useState<LogoField[]>(
    order?.logos?.map(({ name, image_path, image_url, price, width_inches, height_inches, placement, notes }) =>
      ({ name, image_path, image_url, price, width_inches, height_inches, placement, notes })) ?? [emptyLogo()]
  )
  const [garments, setGarments] = useState<GarmentField[]>(
    order?.garments?.map(({ garment_type, quantity, price, color, sizes, supplied_by, notes }) =>
      ({ garment_type, quantity, price, color, sizes: parseGarmentSizes(sizes), supplied_by, notes })) ?? [emptyGarment()]
  )
  const [uploadingLogoIndex, setUploadingLogoIndex] = useState<number | null>(null)
  const [uploadingIntakeForm, setUploadingIntakeForm] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const updateLogo = (i: number, field: keyof LogoField, value: unknown) =>
    setLogos(prev => prev.map((logo, idx) => (idx === i ? { ...logo, [field]: value } : logo)))

  const updateGarment = (i: number, field: keyof GarmentField, value: unknown) =>
    setGarments(prev => prev.map((garment, idx) => (idx === i ? { ...garment, [field]: value } : garment)))

  const onLogoImageChange = async (i: number, file: File | null) => {
    if (!file) return

    setUploadError(null)
    setUploadingLogoIndex(i)

    try {
      const uploaded = await uploadLogoImage(file, 'orders')
      setLogos(prev => prev.map((logo, idx) => (idx === i ? { ...logo, ...uploaded } : logo)))
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image.')
    } finally {
      setUploadingLogoIndex(null)
    }
  }

  const onIntakeFormImageChange = async (file: File | null) => {
    if (!file) return

    setUploadError(null)
    setUploadingIntakeForm(true)

    try {
      const uploaded = await uploadOrderIntakeFormImage(file)
      setIntakeFormImagePath(uploaded.intake_form_image_path)
      setIntakeFormImageUrl(uploaded.intake_form_image_url)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image.')
    } finally {
      setUploadingIntakeForm(false)
    }
  }

  const onCustomerNameChange = (value: string) => {
    setCustomerName(value)

    const matchedCustomer = customers.find(customer =>
      customer.name.trim().toLowerCase() === value.trim().toLowerCase()
    )

    setCustomerId(matchedCustomer?.id ?? '')
  }

  const isCreatingNewCustomer = !order && customerName.trim().length > 0 && !customerId

  return (
    <form action={action} className="space-y-6 max-w-3xl">
      <input type="hidden" name="customer_id" value={customerId} />
      <input type="hidden" name="contact_name" value={contactName} />
      <input type="hidden" name="intake_form_image_path" value={intakeFormImagePath} />
      <input type="hidden" name="intake_form_image_url" value={intakeFormImageUrl} />
      <input type="hidden" name="logos" value={JSON.stringify(logos)} />
      <input
        type="hidden"
        name="garments"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
            {order ? (
              <select
                name="customer_id"
                required
                defaultValue={order.customer_id}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select company…</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  list="customer-options"
                  name="customer_name"
                  required
                  value={customerName}
                  onChange={e => onCustomerNameChange(e.target.value)}
                  placeholder="Start typing a company name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <datalist id="customer-options">
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.name} />
                  ))}
                </datalist>
                <p className="mt-1 text-xs text-gray-500">
                  Choose an existing company or type a new company name to create one automatically.
                </p>
                {isCreatingNewCustomer && (
                  <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div>
                      <label className="block text-xs font-medium text-amber-900 mb-1">Contact Name</label>
                      <input
                        type="text"
                        name="contact_name_input"
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        placeholder="Optional"
                        className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-amber-900 mb-1">Email</label>
                      <input
                        type="email"
                        name="customer_email"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        placeholder="Optional"
                        className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-amber-900 mb-1">Phone</label>
                      <input
                        type="text"
                        name="customer_phone"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="Optional"
                        className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-amber-900 mb-1">Company Notes</label>
                      <textarea
                        name="customer_notes"
                        rows={2}
                        value={customerNotes}
                        onChange={e => setCustomerNotes(e.target.value)}
                        placeholder="Optional"
                        className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
            <input
              type="text"
              name="order_number"
              defaultValue={order?.order_number ?? ''}
              placeholder="Leave blank to auto-generate"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              name="status"
              required
              defaultValue={order?.status ?? 'new'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input
              type="date"
              name="due_date"
              required
              defaultValue={order?.due_date ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={order?.notes ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-slate-900">Order Intake Form Image</label>
                <p className="text-xs text-slate-600 mt-1">Optional photo or scan of the paper intake form.</p>
              </div>
              {intakeFormImageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setIntakeFormImagePath('')
                    setIntakeFormImageUrl('')
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf"
              onChange={e => onIntakeFormImageChange(e.target.files?.[0] ?? null)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {uploadingIntakeForm && <p className="mt-2 text-xs text-slate-500">Uploading...</p>}
            {intakeFormImageUrl && (() => {
              const u = intakeFormImageUrl.toLowerCase()
              const nonRenderable = u.includes('.pdf') || u.includes('.heic') || u.includes('.heif')
              const label = u.includes('.pdf') ? 'PDF uploaded' : 'HEIC image uploaded (preview not available in browser)'
              return nonRenderable ? (
                <div className="mt-3 flex items-center gap-2 p-3 bg-gray-50 border border-slate-200 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5zM8.5 13h1.75c.97 0 1.75.78 1.75 1.75S11.22 16.5 10.25 16.5H9.5V18H8.5v-5zm1 2.5h.75c.41 0 .75-.34.75-.75s-.34-.75-.75-.75H9.5v1.5zm3.5-2.5h1.5c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2H13v-5zm1 4h.5c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1H14v3zm3.5-4h3v1h-2v1h1.5v1H18.5v2h-1v-5z" />
                  </svg>
                  <p className="text-sm text-gray-600">{label}</p>
                </div>
              ) : (
                <img
                  src={intakeFormImageUrl}
                  alt="Order intake form preview"
                  className="mt-3 max-h-56 rounded-lg border border-slate-200 object-contain bg-white"
                />
              )
            })()}
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
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={logo.notes ?? ''}
                  onChange={e => updateLogo(i, 'notes', e.target.value || null)}
                  placeholder="e.g. stitch count, thread colors…"
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
                <input
                  list={`garment-types-${i}`}
                  required
                  value={garment.garment_type}
                  onChange={e => updateGarment(i, 'garment_type', e.target.value)}
                  placeholder="Select or type a garment type"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <datalist id={`garment-types-${i}`}>
                  {GARMENT_TYPES.map(type => <option key={type} value={type} />)}
                </datalist>
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

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={uploadingLogoIndex !== null || uploadingIntakeForm}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {order ? 'Update Order' : 'Create Order'}
        </button>
        <a
          href={order ? `/orders/${order.id}` : '/orders'}
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
