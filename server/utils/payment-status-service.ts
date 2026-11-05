import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { SupabaseOrderRepository } from '#server/repositories/supabase-order.repository'
import { SupabaseTicketRepository } from '#server/repositories/supabase-ticket.repository'
import { SupabaseRsvpRepository } from '#server/repositories/supabase-rsvp.repository'
import { SupabasePaymentEventRepository } from '#server/repositories/supabase-payment-event.repository'
import { TicketService } from '#server/services/ticket.service'
import { PaymentStatusService } from '#server/services/payment-status.service'
import { buildLogger } from '#server/services/logger.factory'

// Payment status is only ever persisted through this service, from
// Midtrans notifications or the Midtrans Status API — never from
// redirect parameters. It runs on the service-role client because
// Midtrans requests carry no user session.
export function usePaymentStatusService(event: H3Event): PaymentStatusService {
  const client = serverSupabaseServiceRole(event)
  const orderRepo = new SupabaseOrderRepository(client)
  const ticketRepo = new SupabaseTicketRepository(client)
  const paymentEventRepo = new SupabasePaymentEventRepository(client)
  const ticketService = new TicketService(
    ticketRepo,
    new SupabaseRsvpRepository(client),
    buildLogger(),
  )
  return new PaymentStatusService(
    orderRepo,
    paymentEventRepo,
    ticketService,
    buildLogger(),
  )
}
