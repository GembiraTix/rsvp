import { z } from 'zod'
import { useTicketTypeService } from '#server/utils/ticket-type-service'

const paramsSchema = z.object({
  id: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const { data: params, error: paramsError } = await getValidatedRouterParams(
    event,
    paramsSchema.safeParse,
  )

  if (paramsError || !params) {
    throw createError({ statusCode: 404, statusMessage: 'invalid slug' })
  }

  // id -> slug in read contexts
  const slug = params.id

  const service = await useTicketTypeService(event)

  try {
    const data = await service.getPublicTicketTypesByEventSlug(slug)

    return { success: true, data }
  } catch (err: unknown) {
    throw createError({
      statusCode: 404,
      statusMessage:
        err instanceof Error ? err.message : 'Acara tidak ditemukan',
    })
  }
})
