import { z } from 'zod'
import { useEventService } from '#server/utils/event-service'

const paramsSchema = z.object({
  id: z.coerce.number(),
})

const bodySchema = z.object({
  enabled: z.boolean(),
  limit: z
    .number()
    .int()
    .nonnegative('Batas pendaftaran tidak boleh negatif.')
    .optional()
    .nullable(),
})

export default defineEventHandler(async (event) => {
  const { auth } = event.context
  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)
  const service = await useEventService(event)

  const registrationLimit = body.enabled ? (body.limit ?? null) : null

  const updatedEvent = await service.updateRegistrationLimit(
    id,
    registrationLimit,
  )

  return { success: true, data: updatedEvent }
})
