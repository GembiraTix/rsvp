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
    await service.deleteEvent(id, {
      id: auth.user.sub,
      role: auth.role,
    })
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus acara'
    const statusCode =
      message.includes('izin') || message.includes('super admin') ? 403 : 400
    throw createError({
      statusCode,
      statusMessage: message,
    })
  }
})
