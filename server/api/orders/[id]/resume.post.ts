import { z } from 'zod'
import { useOrderService } from '#server/utils/order-service'
import { OrderNotPayableError } from '#server/services/order.service'

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

  const order = await orderService.findById(params.id)

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pesanan tidak ditemukan.',
    })
  }

  const isOwner = order.user_id === auth.user.sub
  const isAdmin = ['admin', 'super_admin'].includes(auth.role ?? 'user')

  if (!(isOwner || isAdmin)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Anda tidak memiliki izin untuk melanjutkan pesanan ini.',
    })
  }

  try {
    const { redirectUrl } = await orderService.resumeCheckout(order)
    return {
      success: true,
      data: { redirectUrl },
    }
  } catch (err: unknown) {
    if (err instanceof OrderNotPayableError) {
      throw createError({
        statusCode: err.statusCode,
        statusMessage: err.message,
      })
    }
    throw err
  }
})
