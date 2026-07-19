export type OrderStatus = 'new' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'
export type SuppliedBy = 'us' | 'customer'
export type ImportReviewStatus = 'pending' | 'approved' | 'rejected'

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

export interface OrderLogo {
  id: string
  order_id: string
  name: string | null
  price: number | null
  width_inches: number
  height_inches: number
  placement: string
  notes: string | null
}

export interface OrderGarment {
  id: string
  order_id: string
  garment_type: string
  quantity: number
  price: number | null
  color: string | null
  sizes: string | null
  supplied_by: SuppliedBy
  notes: string | null
}

export interface Order {
  id: string
  customer_id: string
  order_number: string | null
  status: OrderStatus
  due_date: string
  notes: string | null
  created_at: string
  updated_at: string
  customer?: Customer
  logos?: OrderLogo[]
  garments?: OrderGarment[]
}

export interface ImportedOrder {
  id: string
  source: string
  source_identifier: string | null
  review_status: ImportReviewStatus
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  customer_notes: string | null
  order_number: string | null
  order_status: OrderStatus
  due_date: string | null
  notes: string | null
  logos: ImportedLogo[] | null
  garments: ImportedGarment[] | null
  raw_payload: Record<string, unknown> | null
  review_notes: string | null
  approved_order_id: string | null
  created_at: string
  reviewed_at: string | null
}

export interface ImportedLogo {
  name: string | null
  price: number | null
  width_inches: number
  height_inches: number
  placement: string
  notes: string | null
}

export interface ImportedGarment {
  garment_type: string
  quantity: number
  price: number | null
  color: string | null
  sizes: string | null
  supplied_by: SuppliedBy
  notes: string | null
}
