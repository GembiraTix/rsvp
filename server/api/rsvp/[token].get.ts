import { z } from 'zod'
import { useRsvpService } from '#server/utils/rsvp-service'
import { SupabaseEventRepository } from '#server/repositories/supabase-event.repository'
import { serverSupabaseClient } from '#supabase/server'

const paramsSchema = z.object({
  token: z.uuid(),
})

export default defineEventHandler(async (event) => {
  const { token } = await getValidatedRouterParams(event, paramsSchema.parse)
  const service = await useRsvpService(event)

  const rsvp = await service.getRsvpByToken(token)
  if (!rsvp) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Reservasi tidak ditemukan',
    })
  }

  const client = await serverSupabaseClient(event)
  const eventRepo = new SupabaseEventRepository(client)
  const eventData = rsvp.event_id
    ? await eventRepo.findById(rsvp.event_id)
    : null

  return {
    success: true,
    data: {
      ...rsvp,
      events: eventData
        ? {
            id: eventData.id,
            title: eventData.title,
            location: eventData.location,
            starts_at: eventData.starts_at,
            ends_at: eventData.ends_at,
          }
        : null,
    },
  }
})
