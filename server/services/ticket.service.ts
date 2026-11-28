import type {
  ITicketRepository,
  IRsvpRepository,
} from '#server/repositories/interfaces'
import type { CreateRsvpInput, TicketWithTypeName } from '#server/domain/types'
import type { ILogger } from './logger.service'

export class TicketService {
  constructor(
    private readonly ticketRepo: ITicketRepository,
    private readonly rsvpRepo: IRsvpRepository,
    private readonly logger: ILogger,
  ) {}

  // Tickets are created at order creation; settlement registers one RSVP per
  // ticket. Duplicate attendee emails are legal — uniqueness is per ticket_id,
  // enforced by the rsvps_ticket_id_key index. A replayed settlement finds all
  // ticket_ids already registered and inserts nothing.
  async createRsvpsForOrderTickets(input: {
    orderId: string
    eventId: number
  }): Promise<{ created: number }> {
    const tickets = await this.ticketRepo.findTicketsByOrderId(input.orderId)
    if (tickets.length === 0) {
      return { created: 0 }
    }

    const registered = new Set(
      await this.rsvpRepo.findRegisteredTicketIds(
        tickets.map((t) => t.id),
      ),
    )

    const items: CreateRsvpInput[] = tickets
      .filter((ticket) => !registered.has(ticket.id))
      .map((ticket) => ({
        event_id: input.eventId,
        ticket_id: ticket.id,
        name: ticket.attendee_name,
        email: ticket.attendee_email,
        custom_question_answer: null,
        identity_type: ticket.identity_type,
        identity_number: ticket.identity_number,
        whatsapp: ticket.whatsapp,
        gender: ticket.gender,
        token: crypto.randomUUID(),
        is_attending: true,
      }))

    if (items.length > 0) {
      try {
        await this.rsvpRepo.createBatch({ items })
      } catch (err: unknown) {
        // a concurrent settlement (webhook + finish endpoint race) registered
        // these tickets first; the single-statement insert is atomic so
        // nothing was inserted here. supabase-js throws a plain object, so
        // match on the code property instead of instanceof
        if (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          err.code === '23505'
        ) {
          this.logger.warn('Registrations already exist for order tickets', {
            orderId: input.orderId,
          })
          return { created: 0 }
        }
        throw err
      }
    }

    this.logger.info('Registrations created for settled order', {
      orderId: input.orderId,
      ticketCount: tickets.length,
      created: items.length,
    })

    return { created: items.length }
  }

  async findTicketsByOrderId(orderId: string): Promise<TicketWithTypeName[]> {
    return this.ticketRepo.findTicketsByOrderId(orderId)
  }

  async deleteTicketsByOrderId(orderId: string): Promise<void> {
    await this.ticketRepo.deleteByOrderId(orderId)
  }
}
