import type {
  Event,
  CreateEventInput,
  UpdateEventInput,
  UserProfile,
  UpdateUserProfileInput,
  UserRole,
  Rsvp,
  CreateRsvpInput,
  TicketType,
  CreateTicketTypeInput,
  UpdateTicketTypeInput,
  Order,
  OrderItem,
  Ticket,
  CreateOrderInput,
  OrderStatus,
  PaymentStatus,
} from '../domain/types'

export interface IEventRepository {
  findAll(): Promise<Event[]>
  findBySlug(slug: string): Promise<Event | null>
  findById(id: number): Promise<Event | null>
  create(payload: CreateEventInput): Promise<Event>
  update(id: number, payload: UpdateEventInput): Promise<Event>
  delete(id: number): Promise<void>
  updateRegistrationLimit(id: number, limit: number | null): Promise<Event>
}

export interface IUserRepository {
  findById(id: string): Promise<UserProfile | null>
  findAll(): Promise<UserProfile[]>
  update(id: string, payload: UpdateUserProfileInput): Promise<UserProfile>
  updateRole(id: string, role: UserRole): Promise<UserProfile>
  upsert(payload: {
    id: string
    email: string
    name?: string | null
    role?: UserRole
  }): Promise<UserProfile>
}

export interface IRsvpRepository {
  findByToken(token: string): Promise<Rsvp | null>
  findByEventId(eventId: number): Promise<Rsvp[]>
  findByEmail(email: string): Promise<Rsvp[]>
  findByEventAndEmail(eventId: number, email: string): Promise<Rsvp | null>
  create(payload: CreateRsvpInput): Promise<Rsvp>
  createBatch(input: {
    items: {
      event_id: number
      name: string
      email: string | null
      organization: string | null
      token: string
      is_attending: boolean
    }[]
  }): Promise<Rsvp[]>
  delete(id: number): Promise<void>
}

export interface IEmailLogRepository {
  log(entry: {
    rsvpId: number
    email: string
    subject: string
    status: 'sent' | 'failed'
    messageId?: string | null
    error?: string
  }): Promise<void>
}

export interface ITicketTypeRepository {
  findByEventId(eventId: number): Promise<TicketType[]>
  findActiveByEventId(eventId: number): Promise<TicketType[]>
  findById(id: number): Promise<TicketType | null>
  create(payload: CreateTicketTypeInput): Promise<TicketType>
  update(id: number, payload: UpdateTicketTypeInput): Promise<TicketType>
  delete(id: number): Promise<void>
  hasOrders(ticketTypeId: number): Promise<boolean>
}

export interface IOrderRepository {
  create(input: {
    order_number: string
    event_id: number
    user_id: string
    subtotal: number
    admin_fee: number
    total: number
    expires_at: string
    token: string
    status: OrderStatus
    payment_status: PaymentStatus
  }): Promise<Order>
  findById(id: string): Promise<Order | null>
  findByUser(userId: string): Promise<Order[]>
  updateStatus(
    id: string,
    payload: {
      status: OrderStatus
      payment_status: PaymentStatus
    },
  ): Promise<void>
  findByMidtransOrderId(midtransOrderId: string): Promise<Order | null>
  findOrderItemsByOrderId(orderId: string): Promise<OrderItem[]>
  updateMidtrans(
    id: string,
    payload: {
      midtrans_order_id: string
      midtrans_transaction_id: string | null
      checkout_url: string | null
    },
  ): Promise<void>
}

export interface ITicketRepository {
  createOrderItems(input: {
    order_id: string
    items: {
      ticket_type_id: number
      qty: number
      unit_price: number
      total: number
      attendee_data: Record<string, unknown>
    }[]
  }): Promise<OrderItem[]>
  createTickets(input: {
    order_id: string
    user_id: string
    items: {
      ticket_type_id: number
      qty: number
      attendee_name: string
      attendee_email: string
      attendee_phone: string | null
    }[]
  }): Promise<Ticket[]>
  findTicketsByOrderId(orderId: string): Promise<Ticket[]>
}
