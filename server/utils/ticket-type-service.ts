import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { SupabaseEventRepository } from '#server/repositories/supabase-event.repository'
import { SupabaseTicketTypeRepository } from '#server/repositories/supabase-ticket-type.repository'
import { TicketTypeService } from '#server/services/ticket-type.service'
import { buildLogger } from '#server/services/logger.factory'

export async function useTicketTypeService(
  event: H3Event,
): Promise<TicketTypeService> {
  const client = await serverSupabaseClient(event)
  const ticketTypeRepo = new SupabaseTicketTypeRepository(client)
  const eventRepo = new SupabaseEventRepository(client)
  const logger = buildLogger()
  return new TicketTypeService(ticketTypeRepo, eventRepo, logger)
}
