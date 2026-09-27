import { useEventService } from '../../utils/event-service'

export default defineEventHandler(async (event) => {
  const service = await useEventService(event)
  const events = await service.getAllEvents()
  return { success: true, data: events }
})
