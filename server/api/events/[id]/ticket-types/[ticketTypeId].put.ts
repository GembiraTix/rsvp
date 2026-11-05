import { z } from 'zod'
import { useTicketTypeService } from '#server/utils/ticket-type-service'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
  ticketTypeId: z.coerce.number().int().positive(),
})

const updateTicketTypeSchema = z.object({
  name: z.string().min(1, 'Nama tiket wajib diisi.').optional(),
  description: z.string().optional().nullable(),
  categoryId: z.number().int().positive().optional(),
  price: z.number().int().min(0, 'Harga tidak valid.').optional(),
  capacity: z.number().int().positive().optional().nullable(),
  minQty: z.number().int().min(1).optional(),
  maxQty: z.number().int().min(1).optional(),
  multipleOf: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
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

  const body = await readValidatedBody(event, (b) =>
    updateTicketTypeSchema.parse(b),
  )

  const service = await useTicketTypeService(event)

  try {
    const data = await service.updateTicketType(
      id,
      ticketTypeId,
      {
        id: auth.user.sub,
        role: auth.role,
      },
      {
        name: body.name,
        description: body.description,
        categoryId: body.categoryId,
        price: body.price,
        capacity: body.capacity,
        minQty: body.minQty,
        maxQty: body.maxQty,
        multipleOf: body.multipleOf,
        isActive: body.isActive,
      },
    )

    return { success: true, data }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Gagal memperbarui tipe tiket.'

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
