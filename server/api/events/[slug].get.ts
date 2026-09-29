import { z } from 'zod'
import { useEventService } from '#server/utils/event-service'

const paramsSchema = z.object({
  id: z.string(), // we pull in id, but in reality we need slug. so yeah keep that in mind
})

export default defineEventHandler(async (event) => {
  const { data: validatedParams, error } = await getValidatedRouterParams(
    event,
    paramsSchema.safeParse,
  )

  if (error) {
    throw createError({ statusCode: 404, statusMessage: 'invalid slug' })
  }

  const { id: slug } = validatedParams

  const service = await useEventService(event)
  const data = await service.getEventBySlug(slug)

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Acara tidak ditemukan',
    })
  }

  return { success: true, data }
})
