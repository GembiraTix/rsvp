import { z } from 'zod'
import { useEventService } from '#server/utils/event-service'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
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
  const service = await useEventService(event)

  try {
    await service.deleteEvent(id, auth.user.sub)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus acara'
    throw createError({
      statusCode: message.includes('izin') ? 403 : 400,
      statusMessage: message,
    })
  }
})
