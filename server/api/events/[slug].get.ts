import { z } from 'zod'
import { useEventService } from '../../utils/event-service'

const paramsSchema = z.object({
  slug: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const { slug } = await getValidatedRouterParams(event, paramsSchema.parse)
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
