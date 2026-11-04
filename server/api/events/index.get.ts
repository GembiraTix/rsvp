import { useEventService } from '#server/utils/event-service'

export default defineEventHandler(async (event) => {
  const service = await useEventService(event)
  const searchParams = getRequestURL(event).searchParams

  let withDraftParam = searchParams.get('with_draft')

  const events = await service.getAllEvents({
    withDraft: withDraftParam ? withDraftParam === 'true' : undefined,
  })

  return { success: true, data: events }
})
