import { z } from 'zod'
import { useEventService } from '#server/utils/event-service'

const paramsSchema = z.object({
  userId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, paramsSchema.parse)
  const service = await useEventService(event)
  const events = await service.getEventsByCreator(userId)
  return { success: true, data: events }
})
