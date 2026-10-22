import { z } from 'zod'
import { useTicketTypeService } from '#server/utils/ticket-type-service'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
  ticketTypeId: z.coerce.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  const { auth } = event.context
  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const { id, ticketTypeId } = await getValidatedRouterParams(
    event,
    paramsSchema.parse,
  )

  const service = await useTicketTypeService(event)

  try {
    const result = await service.deleteTicketType(id, ticketTypeId, {
      id: auth.user.sub,
      role: auth.role,
    })

    return {
      success: true,
      data: {
        id: result.ticketType.id,
        deleted: result.deleted,
        deactivated: result.deactivated,
      },
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Gagal menghapus tipe tiket.'

    throw createError({
      statusCode: message.includes('izin')
        ? 403
        : message.includes('tidak ditemukan')
          ? 404
          : 400,
      statusMessage: message,
    })
  }
})
