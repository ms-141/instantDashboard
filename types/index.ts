export type OrderStatus = 'new' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'
export type SuppliedBy = 'us' | 'customer'

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
