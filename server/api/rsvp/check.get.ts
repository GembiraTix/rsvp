import { z } from 'zod'
import { useRsvpService } from '#server/utils/rsvp-service'

const querySchema = z.object({
  eventId: z.coerce.number(),
  email: z.email(),
})

export default defineEventHandler(async (event) => {
  const { eventId, email } = await getValidatedQuery(event, querySchema.parse)
  const service = await useRsvpService(event)

  const rsvp = await service.getRsvpByEventAndEmail(eventId, email)
  if (!rsvp) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Reservasi tidak ditemukan',
    })
  }

  return { success: true, data: rsvp }
})
