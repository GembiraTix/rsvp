import { z } from 'zod'
import { useTicketTypeService } from '#server/utils/ticket-type-service'

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

  const service = await useTicketTypeService(event)

  try {
    const data = await service.getTicketTypesByEventSlug(params.id, {
      // id -> slug in read contexts
      id: auth.user.sub,
      role: auth.role,
    })

    return { success: true, data }
  } catch (err: unknown) {
    throw createError({
      statusCode: 403,
      statusMessage:
        err instanceof Error ? err.message : 'Gagal memuat tipe tiket.',
    })
  }
})
