export type OrderStatus = 'new' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'
export type SuppliedBy = 'us' | 'customer'
export type ImportReviewStatus = 'pending' | 'approved' | 'rejected'
export type EmailStatus = 'queued' | 'sent' | 'failed'
export type ActivityEventType =
  | 'order_created'
  | 'order_status_changed'
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'email_received'
  | 'email_opted_out'
  | 'note_added'

export interface Customer {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  notes: string | null
  email_opted_out: boolean
  email_opted_out_at: string | null
  created_at: string
}

export interface OrderLogo {
  id: string
  order_id: string
  name: string | null
  image_path: string | null
  image_url: string | null
  extra_image_urls: string[] | null
  extra_image_paths: string[] | null
  quantity: number
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
  intake_form_image_path: string | null
  intake_form_image_url: string | null
  order_total_override: number | null
  receipt_image_path: string | null
  receipt_image_url: string | null
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
  contact_name: string | null
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
  image_path: string | null
  image_url: string | null
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

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body_html: string
  created_at: string
  updated_at: string
}

export interface EmailAutomation {
  id: string
  name: string
  trigger_status: OrderStatus
  template_id: string
  enabled: boolean
  created_at: string
  template?: EmailTemplate
}

export interface EmailMessage {
  id: string
  tracking_id: string
  customer_id: string
  order_id: string | null
  template_id: string | null
  automation_id: string | null
  to_email: string
  from_email: string
  subject: string
  body_html: string
  status: EmailStatus
  provider_message_id: string | null
  thread_id: string | null
  error_message: string | null
  open_count: number
  first_opened_at: string | null
  last_opened_at: string | null
  click_count: number
  first_clicked_at: string | null
  last_clicked_at: string | null
  sent_at: string | null
  created_at: string
  customer?: Customer
  order?: Order
}

export interface EmailEvent {
  id: string
  email_message_id: string
  event_type: 'open' | 'click'
  url: string | null
  user_agent: string | null
  ip: string | null
  created_at: string
}

export interface EmailReply {
  id: string
  customer_id: string | null
  email_message_id: string | null
  gmail_message_id: string
  gmail_thread_id: string | null
  from_email: string
  to_email: string | null
  subject: string
  body_text: string
  body_html: string | null
  received_at: string
  is_read: boolean
  is_opt_out: boolean
  created_at: string
}

export interface ActivityEvent {
  id: string
  customer_id: string
  order_id: string | null
  email_message_id: string | null
  type: ActivityEventType
  title: string
  description: string | null
  metadata: Record<string, unknown>
  created_at: string
}
