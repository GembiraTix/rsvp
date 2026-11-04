import z from 'zod'

export default defineEventHandler(async (e) => {
  const { auth } = e.context
  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const service = await useEventService(e)

  const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
  })

  const { data: params, error } = await getValidatedRouterParams(
    e,
    paramsSchema.safeParse,
  )
  if (error || !params) {
    throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  }

  const bodySchema = z.object({
    isDraft: z.boolean().nullable().optional(),
  })

  const { data: body, error: bodyError } = await readValidatedBody(
    e,
    bodySchema.safeParse,
  )
  if (bodyError) {
    throw createError({ statusCode: 400, statusMessage: 'invalid body' })
  }

  await service.updateDraftStatus(params.id, body.isDraft ?? false)
})
