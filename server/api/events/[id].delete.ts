import { z } from 'zod'
import { serverSupabaseUser } from '#supabase/server'
import { useEventService } from '../../utils/event-service'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const service = await useEventService(event)

  try {
    await service.deleteEvent(id, user.sub || user.id)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus acara'
    throw createError({
      statusCode: message.includes('izin') ? 403 : 400,
      statusMessage: message,
    })
  }
})
