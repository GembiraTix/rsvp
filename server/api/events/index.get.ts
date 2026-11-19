import { useEventService } from '#server/utils/event-service'

export default defineEventHandler(async (event) => {
  const service = await useEventService(event)
  const searchParams = getRequestURL(event).searchParams

  const withDraftParam = searchParams.get('with_draft')
  const withDeletedParam = searchParams.get('with_deleted')

  if (withDeletedParam === 'true') {
    const { auth } = event.context
    if (!auth.user || !['admin', 'super_admin'].includes(auth.role ?? '')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Hanya admin yang dapat melihat acara yang dihapus.',
      })
    }
  }

  const events = await service.getAllEvents({
    withDraft: withDraftParam ? withDraftParam === 'true' : undefined,
    withDeleted: withDeletedParam === 'true',
  })

  return { success: true, data: events }
})
