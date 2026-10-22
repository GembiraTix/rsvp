import { z } from 'zod'
import { useTicketTypeService } from '#server/utils/ticket-type-service'

const paramsSchema = z.object({
  id: z.coerce.number().positive(),
})

const createTicketTypeSchema = z.object({
  name: z.string().min(1, 'Nama tiket wajib diisi.'),
  description: z.string().optional(),
  kind: z.enum(['single', 'couple', 'berempat']).default('single'),
  price: z.number().int().min(0, 'Harga tidak valid.').default(0),
  capacity: z.number().int().positive().optional().nullable(),
  minQty: z.number().int().min(1).optional(),
  maxQty: z.number().int().min(1).optional(),
  multipleOf: z.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
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

  const body = await readValidatedBody(event, (b) =>
    createTicketTypeSchema.parse(b),
  )

  const service = await useTicketTypeService(event)

  try {
    const data = await service.createTicketType(
      params.id,
      {
        id: auth.user.sub,
        role: auth.role,
      },
      {
        name: body.name,
        description: body.description,
        kind: body.kind,
        price: body.price,
        capacity: body.capacity ?? null,
        minQty: body.minQty,
        maxQty: body.maxQty,
        multipleOf: body.multipleOf,
        isActive: body.isActive,
      },
    )

    return { success: true, data }
  } catch (err: unknown) {
    throw createError({
      statusCode: 403,
      statusMessage:
        err instanceof Error ? err.message : 'Gagal membuat tipe tiket.',
    })
  }
})
