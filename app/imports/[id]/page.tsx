import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ImportReviewForm from '@/components/ImportReviewForm'
import type { ImportedOrder, ImportedGarment, ImportedLogo } from '@/types'

function normalizeLogos(value: unknown): ImportedLogo[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .filter(item => {
      return (
        typeof item.width_inches === 'number' &&
        typeof item.height_inches === 'number' &&
        typeof item.placement === 'string'
      )
    })
    .map(item => ({
      name: typeof item.name === 'string' ? item.name : null,
      width_inches: item.width_inches as number,
      height_inches: item.height_inches as number,
      placement: item.placement as string,
      notes: typeof item.notes === 'string' ? item.notes : null,
    }))
}

function normalizeGarments(value: unknown): ImportedGarment[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .filter(item => {
      return typeof item.garment_type === 'string' && typeof item.quantity === 'number'
    })
    .map(item => ({
      garment_type: item.garment_type as string,
      quantity: item.quantity as number,
      color: typeof item.color === 'string' ? item.color : null,
      sizes: typeof item.sizes === 'string' ? item.sizes : null,
      supplied_by: item.supplied_by === 'us' ? 'us' : 'customer',
      notes: typeof item.notes === 'string' ? item.notes : null,
    }))
}

export default async function ImportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('imported_orders')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const importedOrder: ImportedOrder = {
    ...data,
    logos: normalizeLogos(data.logos),
    garments: normalizeGarments(data.garments),
    raw_payload:
      data.raw_payload && typeof data.raw_payload === 'object'
        ? (data.raw_payload as Record<string, unknown>)
        : null,
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/imports" className="text-gray-400 hover:text-gray-600 text-sm">← Imported Orders</Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Imported Order</h1>
        <p className="text-sm text-gray-500 mt-1">
          Source: {importedOrder.source} · Status: {importedOrder.review_status}
        </p>
      </div>

      {importedOrder.review_status === 'approved' && importedOrder.approved_order_id && (
        <div className="bg-green-50 border border-green-100 text-green-800 rounded-xl p-4 mb-6 text-sm">
          Already approved. View live order:{' '}
          <Link href={`/orders/${importedOrder.approved_order_id}`} className="underline font-medium">
            {importedOrder.approved_order_id.slice(0, 8)}
          </Link>
        </div>
      )}

      <ImportReviewForm importedOrder={importedOrder} />
    </div>
  )
}
