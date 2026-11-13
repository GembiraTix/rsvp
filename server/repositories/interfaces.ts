import type {
  Event,
  CreateEventInput,
  UpdateEventInput,
  UserProfile,
  UpdateUserProfileInput,
  UserRole,
  Rsvp,
  CreateRsvpInput,
  RsvpWithEvent,
  TicketType,
  CreateTicketTypeInput,
  UpdateTicketTypeInput,
  Order,
  OrderItem,
  Ticket,
  OrderWithEvent,
  TicketWithTypeName,
  OrderStatus,
  PaymentStatus,
  AttendeeGender,
  IdentityType,
} from '../domain/types'

export type EventFindOptions = {
  withDraft?: boolean
}

export interface IEventRepository {
  /**
   * by default returns all events that are not drafts and are not deleted
   * */
  find(options?: EventFindOptions): Promise<Event[]>
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
  findById(id: number): Promise<Rsvp | null>
  findByEventId(eventId: number): Promise<Rsvp[]>
  findByEmail(email: string): Promise<Rsvp[]>
  findAttendingByEmail(email: string): Promise<RsvpWithEvent[]>
  countAttendingByEventId(eventId: number): Promise<number>
  findByEventAndEmail(eventId: number, email: string): Promise<Rsvp | null>
  findRegisteredEmails(eventId: number, emails: string[]): Promise<string[]>
  create(payload: CreateRsvpInput): Promise<Rsvp>
  createBatch(input: { items: CreateRsvpInput[] }): Promise<Rsvp[]>
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

  updateDeliverability(entry: {
    providerMessageId: string
    status: 'sent' | 'delivered' | 'bounced' | 'failed'
    errorMessage?: string | null
    deliveredAt?: string | null
    metadata?: Record<string, unknown>
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
    id: string
    order_number: string
    event_id: number
    user_id: string
    subtotal: number
    admin_fee: number
    total: number
    expires_at: string
    token: string
    midtrans_order_id: string
    checkout_url: string
    status: OrderStatus
    payment_status: PaymentStatus
  }): Promise<Order>
  findById(id: string): Promise<Order | null>
  findByUser(userId: string): Promise<OrderWithEvent[]>
  updateStatus(
    id: string,
    payload: {
      status: OrderStatus
      payment_status: PaymentStatus
      paid_at?: string
      midtrans_transaction_id?: string | null
    },
    guard?: {
      onlyIfPaymentStatusIn?: PaymentStatus[]
      unlessPaymentStatusIn?: PaymentStatus[]
    },
  ): Promise<boolean>
  updateCheckoutUrl(id: string, checkoutUrl: string): Promise<void>
  findByMidtransOrderId(midtransOrderId: string): Promise<Order | null>
  findOrderItemsByOrderId(orderId: string): Promise<OrderItem[]>
}

export interface ISettingsRepository {
  getAdminFee(): Promise<number>
  updateAdminFee(adminFee: number): Promise<void>
  getEventPaymentSettings(
    eventId: number,
  ): Promise<{ admin_fee_fixed: number | null } | null>
}

export interface IPaymentEventRepository {
  existsByTransactionAndStatus(
    midtransTransactionId: string,
    eventType: string,
  ): Promise<boolean>
  create(input: {
    order_id: string | null
    midtrans_order_id: string | null
    midtrans_transaction_id: string | null
    event_type: string
    payload: Record<string, unknown>
    signature_valid?: boolean | null
  }): Promise<string>
  markProcessed(id: string, error?: string): Promise<void>
}

export interface ITicketRepository {
  createOrderItems(input: {
    order_id: string
    items: {
      ticket_type_id: number
      qty: number
      unit_price: number
      total: number
    }[]
  }): Promise<OrderItem[]>
  createTickets(input: {
    order_id: string
    user_id: string
    items: {
      ticket_type_id: number
      attendees: {
        name: string
        email: string
        phone: string | null
        identity_type: IdentityType
        identity_number: string
        whatsapp: string
        gender: AttendeeGender
      }[]
    }[]
  }): Promise<Ticket[]>
  findTicketsByOrderId(orderId: string): Promise<TicketWithTypeName[]>
  countPendingOrderTicketsByEventId(eventId: number): Promise<number>
  deleteByOrderId(orderId: string): Promise<void>
}
