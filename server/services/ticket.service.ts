import type { ITicketRepository } from '#server/repositories/interfaces'
import type { Ticket } from '#server/domain/types'
import type { ILogger } from './logger.service'

export class TicketService {
  constructor(
    private readonly ticketRepo: ITicketRepository,
    private readonly logger: ILogger,
  ) {}

  async issueTickets(input: {
    orderId: string
    userId: string
    attendeeName: string
    attendeeEmail: string
    attendeeEmailPhone: string | null
    items: {
      ticket_type_id: number
      qty: number
    }[]
  }): Promise<Ticket[]> {
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

    this.logger.info('Tickets issued', {
      orderId: input.orderId,
      ticketCount: tickets.length,
      userId: input.userId,
    })

    return tickets
  }

  async findTicketsByOrderId(orderId: string): Promise<Ticket[]> {
    return this.ticketRepo.findTicketsByOrderId(orderId)
  }
}
