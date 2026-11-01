import { z } from 'zod'
import { useRsvpService } from '#server/utils/rsvp-service'

const paramsSchema = z.object({
  id: z.coerce.number().positive(),
})

export default defineEventHandler(async (event) => {
  const { data: params, error: paramsError } = await getValidatedRouterParams(
    event,
    paramsSchema.safeParse,
  )

  if (paramsError || !params) {
    throw createError({ statusCode: 404, statusMessage: 'invalid event id' })
  }

  const rsvpService = await useRsvpService(event)
  const count = await rsvpService.countAttendingByEventId(params.id)

  return { success: true, data: { count } }
})
