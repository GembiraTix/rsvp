import { z } from 'zod'
import { useEventService } from '#server/utils/event-service'
import { useRsvpService } from '#server/utils/rsvp-service'

const paramsSchema = z.object({
  id: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const { auth } = event.context
  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const { data: params, error: paramsError } = await getValidatedRouterParams(
    event,
    paramsSchema.safeParse,
  )

  if (paramsError || !params) {
    throw createError({ statusCode: 404, statusMessage: 'invalid slug' })
  }

  const eventService = await useEventService(event)
  const resolved = await eventService.getEventBySlug(params.id)

  if (!resolved) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Acara tidak ditemukan.',
    })
  }

  if (
    resolved.created_by !== auth.user.sub &&
    auth.role !== 'admin' &&
    auth.role !== 'super_admin'
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Anda tidak memiliki izin untuk acara ini.',
    })
  }

  const rsvpService = await useRsvpService(event)
  const attendees = await rsvpService.listRsvpsByEvent(resolved.id)

  return { success: true, data: attendees }
})
