import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { SupabaseTicketRepository } from '#server/repositories/supabase-ticket.repository'
import { SupabaseRsvpRepository } from '#server/repositories/supabase-rsvp.repository'
import { SupabaseEventRepository } from '#server/repositories/supabase-event.repository'
import { TicketService } from '#server/services/ticket.service'
import { buildLogger } from '#server/services/logger.factory'

export async function useTicketService(
  event: H3Event,
): Promise<TicketService> {
  const client = await serverSupabaseClient(event)
  const ticketRepo = new SupabaseTicketRepository(client)
  const rsvpRepo = new SupabaseRsvpRepository(client)
  const eventRepo = new SupabaseEventRepository(client)
  const logger = buildLogger()
  return new TicketService(ticketRepo, rsvpRepo, eventRepo, logger)
}
