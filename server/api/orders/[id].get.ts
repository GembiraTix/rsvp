import { z } from 'zod'
import { useOrderService } from '#server/utils/order-service'

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
    console.error(paramsError)

    throw createError({
      statusCode: 404,
      statusMessage: 'invalid order id',
    })
  }

  const orderService = await useOrderService(event)

  const order = await orderService.findById(params.id)

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pesanan tidak ditemukan.',
    })
  }

  if (
    order.user_id !== auth.user.sub ||
    !['admin', 'super_admin'].includes(auth.role ?? 'user')
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Anda tidak memiliki izin untuk melihat pesanan ini.',
    })
  }

  return { success: true, data: order }
})
