import type { Database } from '~/types/database.types'

export interface Event {
  id: number
  slug: string
  title: string | null
  description: string | null
  location: string | null
  starts_at: string | null
  ends_at: string | null
  image_url: string | null
  created_by: string
  created_at: string
  deleted_at?: string | null
  registration_limit?: number | null
}

export type CreateEventInput = Omit<Event, 'id' | 'created_at'>
export type UpdateEventInput = Partial<
  Omit<Event, 'id' | 'created_at' | 'created_by'>
>

export type UserRole = Database['public']['Enums']['user_role']

export interface UserProfile {
  id: string
  email: string
  name: string | null
  role: UserRole
  created_at: string
}

export interface UpdateUserProfileInput {
  name?: string | null
  email?: string
  role?: UserRole
}

export interface Rsvp {
  id: number
  event_id: number | null
  name: string
  email: string | null
  organization: string | null
  token: string
  is_attending: boolean
  created_at: string
}

export interface RsvpEventSummary {
  id: number
  slug: string
  title: string | null
  location: string | null
  starts_at: string | null
  ends_at: string | null
}

export interface RsvpWithEvent extends Rsvp {
  event: RsvpEventSummary | null
}

export type CreateRsvpInput = Omit<Rsvp, 'id' | 'created_at'>
export type UpdateRsvpInput = Partial<Omit<Rsvp, 'id' | 'created_at' | 'token'>>
export type TicketTypeKind = 'single' | 'couple' | 'berempat'

export type TicketType = {
  capacity: number | null
  created_at: string
  description: string | null
  event_id: number
  id: number
  is_active: boolean
  kind: TicketTypeKind
  max_qty: number
  min_qty: number
  multiple_of: number
  name: string
  price: number
  sort_order: number
  updated_at: string
}

export type CreateTicketTypeInput = Omit<
  TicketType,
  'id' | 'created_at' | 'updated_at'
>

export type UpdateTicketTypeInput = Partial<
  Omit<CreateTicketTypeInput, 'event_id' | 'sort_order'>
>

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'paid'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'partial_refund'
  | 'failed'

export type PaymentStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'settled'
  | 'paid'
  | 'cancelled'
  | 'expired'
  | 'failed'
  | 'refunded'
  | 'partial_refund'

export interface Order {
  id: string
  order_number: string
  event_id: number
  user_id: string
  subtotal: number
  admin_fee: number
  total: number | null
  status: OrderStatus
  payment_status: PaymentStatus
  midtrans_order_id: string | null
  midtrans_transaction_id: string | null
  token: string
  checkout_url: string | null
  paid_at: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

export interface OrderEventSummary {
  id: number
  slug: string
  title: string | null
  starts_at: string | null
  location: string | null
}

export interface OrderWithEvent extends Order {
  event: OrderEventSummary | null
}

export interface OrderItem {
  id: number
  order_id: string
  qty: number
  ticket_type_id: number
  total: number
  unit_price: number
  attendee_data: Record<string, unknown>
  created_at: string
}

export interface Ticket {
  id: number
  order_id: string
  ticket_type_id: number
  attendee_name: string
  attendee_email: string
  attendee_phone: string | null
  token: string
  fields: Record<string, unknown> | null
  checkin_at: string | null
  created_at: string
}

export interface TicketWithTypeName extends Ticket {
  ticket_type_name: string | null
}

export interface CreateOrderInput {
  eventId: number
  userId: string
  lines: {
    ticketTypeId: number
    name: string
    unitPrice: number
    qty: number
  }[]
}
