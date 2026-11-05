import { z } from 'zod'
import { useRsvpService } from '#server/utils/rsvp-service'

const bodySchema = z.object({
  eventId: z.coerce.number().positive(),
  emails: z.array(z.string()).max(50),
})

export default defineEventHandler(async (event) => {
  const { auth } = event.context
  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const body = await readValidatedBody(event, (b) => bodySchema.parse(b))

  const service = await useRsvpService(event)
  const registered = await service.findRegisteredEmails(
    body.eventId,
    body.emails,
  )

  return { success: true, data: { registered } }
})
