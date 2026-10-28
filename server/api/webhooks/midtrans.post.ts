import { useOrderService } from '#server/utils/order-service'
import { useTicketService } from '#server/utils/ticket-service'
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

  const { orderStatus, paymentStatus } = mapMidtransStatusToOrder(status_code)

  const isSettled = paymentStatus === 'settled' || paymentStatus === 'paid'

  await orderService.updateStatus(order.id, {
    status: orderStatus,
    payment_status: paymentStatus,
  })
  console.log(`successfully updated order ${order.id} status to ${orderStatus}`)

  // Issue tickets when payment is settled/paid (idempotent: skip if tickets exist)
  if (isSettled) {
    const ticketService = await useTicketService(event)
    const existingTickets = await ticketService.findTicketsByOrderId(order.id)

    if (existingTickets.length === 0) {
      const orderItems = await orderService.findOrderItemsByOrderId(order.id)
      const userProfile = await orderService.getUserProfile(order.user_id)

      if (orderItems.length > 0 && userProfile) {
        await ticketService.issueTickets({
          orderId: order.id,
          userId: order.user_id,
          attendeeName: userProfile.name ?? 'Tamu',
          attendeeEmail: userProfile.email ?? '',
          attendeeEmailPhone: null,
          items: orderItems.map((item) => ({
            ticket_type_id: item.ticket_type_id,
            qty: item.qty,
          })),
        })
        console.log(
          `tickets issued for order ${order.id} (${orderItems.length} line items)`,
        )
      }
    }
  }

  return { success: true }
})
