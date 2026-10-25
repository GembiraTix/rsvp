import { z } from 'zod'
import { useOrderService } from '#server/utils/order-service'
import { useTicketService } from '#server/utils/ticket-service'

const paramsSchema = z.object({
  id: z.string(),
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
    throw createError({
      statusCode: 404,
      statusMessage: 'invalid order id',
    })
  }

  const orderService = await useOrderService(event)
  const ticketService = await useTicketService(event)

  const order = await orderService.findById(params.id)

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pesanan tidak ditemukan.',
    })
  }

  if (
    order.user_id !== auth.user.sub &&
    auth.role !== 'admin' &&
    auth.role !== 'super_admin'
  ) {
    throw createError({
      statusCode: 403,
      statusMessage:
        'Anda tidak memiliki izin untuk melihat tiket ini.',
    })
  }

  const tickets = await ticketService.findTicketsByOrderId(params.id)

  return { success: true, data: tickets }
})
