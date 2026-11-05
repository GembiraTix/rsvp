import type {
  ITicketRepository,
  IRsvpRepository,
} from '#server/repositories/interfaces'
import type { Ticket } from '#server/domain/types'
import type { ILogger } from './logger.service'

export class TicketService {
  constructor(
    private readonly ticketRepo: ITicketRepository,
    private readonly rsvpRepo: IRsvpRepository,
    private readonly logger: ILogger,
  ) {}

  // Tickets are created at order creation; settlement only registers each
  // ticket's attendee. Emails already registered for the event are skipped
  // so a paid order can never wedge.
  async createRsvpsForOrderTickets(input: {
    orderId: string
    eventId: number
  }): Promise<{ created: number; skipped: number }> {
    const tickets = await this.ticketRepo.findTicketsByOrderId(input.orderId)
    if (tickets.length === 0) {
      return { created: 0, skipped: 0 }
    }

    const registered = new Set(
      (
        await this.rsvpRepo.findRegisteredEmails(
          input.eventId,
          tickets.map((t) => t.attendee_email),
        )
      ).map((email) => email.toLowerCase()),
    )

    const items: {
      event_id: number
      name: string
      email: string | null
      organization: string | null
      token: string
      is_attending: boolean
    }[] = []
    let skipped = 0

    for (const ticket of tickets) {
      if (registered.has(ticket.attendee_email.trim().toLowerCase())) {
        skipped += 1
        this.logger.warn('Skipping registration for already-registered email', {
          orderId: input.orderId,
          ticketId: ticket.id,
          email: ticket.attendee_email,
        })
        continue
      }

      items.push({
        event_id: input.eventId,
        name: ticket.attendee_name,
        email: ticket.attendee_email,
        organization: null,
        token: crypto.randomUUID(),
        is_attending: true,
      })
    }

    if (items.length > 0) {
      await this.rsvpRepo.createBatch({ items })
    }

    this.logger.info('Registrations created for settled order', {
      orderId: input.orderId,
      ticketCount: tickets.length,
      created: items.length,
      skipped,
    })

    return { created: items.length, skipped }
  }

  async findTicketsByOrderId(orderId: string): Promise<Ticket[]> {
    return this.ticketRepo.findTicketsByOrderId(orderId)
  }

  async deleteTicketsByOrderId(orderId: string): Promise<void> {
    await this.ticketRepo.deleteByOrderId(orderId)
  }
}
