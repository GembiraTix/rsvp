import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { SupabaseRsvpRepository } from '#server/repositories/supabase-rsvp.repository'
import { SupabaseEventRepository } from '#server/repositories/supabase-event.repository'
import { SupabaseEmailLogRepository } from '#server/repositories/supabase-emaillog.repository'
import { RsvpService } from '#server/services/rsvp.service'
import { buildLogger } from '#server/services/logger.factory'

export async function useRsvpService(event: H3Event): Promise<RsvpService> {
  const client = await serverSupabaseClient(event)
  const rsvpRepo = new SupabaseRsvpRepository(client)
  const eventRepo = new SupabaseEventRepository(client)
  const emailLogRepo = new SupabaseEmailLogRepository(client)
  const logger = buildLogger()
  return new RsvpService(rsvpRepo, eventRepo, emailLogRepo, logger)
}
