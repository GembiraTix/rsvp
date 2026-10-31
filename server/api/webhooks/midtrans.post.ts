import { getMidtransConfig } from '#server/utils/order-service'
import { usePaymentStatusService } from '#server/utils/payment-status-service'
import crypto from 'node:crypto'
import { z } from 'zod'

const notificationSchema = z.object({
  order_id: z.string(),
  status_code: z.string(),
  gross_amount: z.string(),
  signature_key: z.string(),
  transaction_status: z.string(),
  transaction_id: z.string().optional(),
  fraud_status: z.string().nullish(),
  payment_type: z.string().nullish(),
  status_message: z.string().nullish(),
})

export default defineEventHandler(async (event) => {
  const { serverKey } = getMidtransConfig()

  const { data: notification, error } = await readValidatedBody(
    event,
    notificationSchema.safeParse,
  )

  if (error || !notification) {
    console.error('unexpected payment gateway notification: ', notification)
    return { success: false }
  }

  const { order_id, status_code, gross_amount, signature_key } = notification

  const expectedSignature = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex')

  if (expectedSignature !== signature_key) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid signature.',
    })
  }

  const paymentStatusService = usePaymentStatusService(event)
  const order = await paymentStatusService.findByMidtransOrderId(order_id)

  if (!order) {
    console.error('order not found for notification: ', order_id)
    return { success: false }
  }

  const result = await paymentStatusService.applyMidtransUpdate({
    order,
    transactionStatus: notification.transaction_status,
    fraudStatus: notification.fraud_status,
    grossAmount: gross_amount,
    transactionId: notification.transaction_id,
    paymentType: notification.payment_type,
    source: 'notification',
    raw: notification,
    signatureValid: true,
  })

  console.log(`notification for order ${order.id} processed: ${result}`)

  return { success: true }
})
