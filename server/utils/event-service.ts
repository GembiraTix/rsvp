import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { SupabaseEventRepository } from '../repositories/supabase-event.repository'
import { EventService } from '../services/event.service'
import { buildLogger } from '../services/logger.factory'

export async function useEventService(event: H3Event): Promise<EventService> {
  const client = await serverSupabaseClient(event)
  const repo = new SupabaseEventRepository(client)
  const logger = buildLogger()
  return new EventService(repo, logger)
}
