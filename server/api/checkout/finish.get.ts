import { z } from 'zod'
import { useOrderService } from '#server/utils/order-service'
import { mapMidtransStatusToOrder } from '#server/services/order.service'

const querySchema = z.object({
  order_id: z.string(),
  status_code: z.string(),
  transaction_status: z.string(),
})

export default defineEventHandler(async (event) => {
  const { auth } = event.context
  if (!auth.user) {
    return sendRedirect(event, '/login', 302)
  }

  const { data: query, error: queryError } = await getValidatedQuery(
    event,
    querySchema.safeParse,
  )

  if (queryError || !query) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parameter pembayaran tidak lengkap.',
    })
  }

  const { order_id, status_code: _status_code, transaction_status } = query

  const orderService = await useOrderService(event)
  const order = await orderService.findByMidtransOrderId(order_id)

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pesanan tidak ditemukan.',
    })
  }

  if (order.user_id !== auth.user.sub) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Anda tidak memiliki izin untuk pesanan ini.',
    })
  }

  // Idempotency: if order already settled, skip mutation
  const isSettled = order.payment_status === 'settled'

  if (!isSettled) {
    const { orderStatus, paymentStatus } =
      mapMidtransStatusToOrder(transaction_status)

    await orderService.updateStatus(order.id, {
      status: orderStatus,
      payment_status: paymentStatus,
    })
  }

  const finishStatus = isSettled ? 'paid' : transaction_status

  return sendRedirect(
    event,
    `/checkout/finish?orderId=${order.id}&status=${finishStatus}`,
    302,
  )
})
