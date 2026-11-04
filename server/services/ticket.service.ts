import type {
  ITicketRepository,
  IRsvpRepository,
  IEventRepository,
} from '#server/repositories/interfaces'
import type { Ticket } from '#server/domain/types'
import type { ILogger } from './logger.service'

export class TicketService {
  constructor(
    private readonly ticketRepo: ITicketRepository,
    private readonly rsvpRepo: IRsvpRepository,
    private readonly eventRepo: IEventRepository,
    private readonly logger: ILogger,
  ) {}

  async issueTickets(input: {
    orderId: string
    userId: string
    eventId: number
    attendeeName: string
    attendeeEmail: string
    attendeeEmailPhone: string | null
    items: {
      ticket_type_id: number
      qty: number
    }[]
  }): Promise<Ticket[]> {
    const event = await this.eventRepo.findById(input.eventId)

    if (event && event.registration_limit) {
      // TODO: add dedicated rsvpRepo (registrationRepo) method to
      // count # of registrations directly from the db
      const attendingRsvps = await this.rsvpRepo.findByEventId(input.eventId)
      const attendingCount = attendingRsvps.filter((r) => r.is_attending).length
      const totalQty = input.items.reduce((sum, item) => sum + item.qty, 0)
      if (attendingCount + totalQty > event.registration_limit) {
        throw new Error('Kuota penuh')
      }
    }

    const tickets = await this.ticketRepo.createTickets({
      order_id: input.orderId,
      user_id: input.userId,
      items: input.items.map((item) => ({
        ticket_type_id: item.ticket_type_id,
        qty: item.qty,
        attendee_name: input.attendeeName,
        attendee_email: input.attendeeEmail,
        attendee_phone: input.attendeeEmailPhone,
      })),
    })

    const rsvpItems = tickets.map((ticket) => ({
      event_id: input.eventId,
      name: ticket.attendee_name,
      email: ticket.attendee_email,
      organization: null,
      token: crypto.randomUUID(),
      is_attending: true,
    }))

    await this.rsvpRepo.createBatch({ items: rsvpItems })

    this.logger.info('Tickets issued', {
      orderId: input.orderId,
      ticketCount: tickets.length,
      rsvpCount: rsvpItems.length,
      userId: input.userId,
    })

    return tickets
  }

  async findTicketsByOrderId(orderId: string): Promise<Ticket[]> {
    return this.ticketRepo.findTicketsByOrderId(orderId)
  }
}
