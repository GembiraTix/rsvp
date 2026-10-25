import { useOrderService } from '#server/utils/order-service'
import { mapMidtransStatusToOrder } from '#server/services/order.service'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const serverKey = config.midtransServerKey as string

  const body = await readBody(event)

  const { order_id, status_code, gross_amount, signature_key } = body as {
    order_id?: string
    status_code?: string
    gross_amount?: string
    signature_key?: string
  }

  // Verify Midtrans signature
  const expectedSignature = crypto
    .createHash('sha256')
    .update(
      `${order_id ?? ''}${status_code ?? ''}${gross_amount ?? ''}${serverKey}`,
    )
    .digest('hex')

  const signatureValid = signature_key && expectedSignature === signature_key

  if (!signatureValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid signature.',
    })
  }

  const orderService = await useOrderService(event)

  // Find order by Midtrans order ID (format: ORDER-{id})
  const order = await orderService.findByMidtransOrderId(order_id ?? '')

  // Idempotency: if order already settled, return 200
  if (order && order.payment_status === 'settled') {
    return { success: true }
  }

  const { orderStatus, paymentStatus } = mapMidtransStatusToOrder(
    status_code ?? 'pending',
  )

  if (order) {
    await orderService.updateStatus(order.id, orderStatus)

    // Update payment_status too via repo would need extension; status is enough for now
  }

  return { success: true }
})
