import type { OrderStatus } from '@/types'

const config: Record<OrderStatus, { label: string; cls: string }> = {
  new:         { label: 'New',         cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
  completed:   { label: 'Completed',   cls: 'bg-green-100 text-green-700' },
  delivered:   { label: 'Delivered',   cls: 'bg-gray-100 text-gray-600' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-100 text-red-600' },
}

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, cls } = config[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
