import { useOrderService } from '#server/utils/order-service'
import { mapMidtransStatusToOrder } from '#server/services/order.service'
import crypto from 'node:crypto'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { serverKey } = getMidtransConfig()

  const bodySchema = z.object({
    order_id: z.string(),
    status_code: z.string(),
    gross_amount: z.string(),
    signature_key: z.string(),
  })
  const { data, error } = await readValidatedBody(event, bodySchema.safeParse)

  if (error || !data) {
    console.error('unexpected payment gateway notification: ', data)
    return { success: false }
  }

  const { order_id, status_code, gross_amount, signature_key } = data

  console.log('verifying signature')
  const expectedSignature = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex')

  const isSignatureValid = signature_key && expectedSignature === signature_key

  if (!isSignatureValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid signature.',
    })
  }

  const orderService = await useOrderService(event)
  console.log('finding order ', order_id)
  const order = await orderService.findByMidtransOrderId(order_id)

  if (!order) {
    console.error('order not found')
    return { success: false }
  }

  // if order already settled, return 200
  if (order.payment_status === 'settled') {
    return { success: true }
  }

  const { orderStatus, paymentStatus } = mapMidtransStatusToOrder(
    status_code ?? 'pending',
  )

  await orderService.updateStatus(order.id, orderStatus)
  console.log(`successfully updated order ${order.id} status to ${orderStatus}`)
  // Update payment_status too via repo would need extension; status is enough for now

  return { success: true }
})
