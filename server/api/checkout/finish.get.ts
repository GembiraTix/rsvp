import { z } from 'zod'
import { getMidtransConfig } from '#server/utils/order-service'
import { usePaymentStatusService } from '#server/utils/payment-status-service'
// @ts-expect-error - midtrans-client has no type declarations
import midtrans from 'midtrans-client'

const querySchema = z.object({
  order_id: z.string(),
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

  const { order_id } = query

  const paymentStatusService = usePaymentStatusService(event)
  const order = await paymentStatusService.findByMidtransOrderId(order_id)

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

  // Redirect params are untrusted
  // The order status is reconciled against the Midtrans Status API;
  // the HTTP notification webhook remains the primary source of truth
  try {
    const { serverKey, clientKey, isProduction } = getMidtransConfig()
    const snap = new midtrans.Snap({
      isProduction,
      serverKey,
      clientKey,
    })

    const statusResponse = await snap.transaction.status(order_id)
    const statusSchema = z.object({
      transaction_status: z.string(),
      fraud_status: z.string().nullish(),
      gross_amount: z.string().nullish(),
      transaction_id: z.string().nullish(),
      payment_type: z.string().nullish(),
    })
    const parsed = statusSchema.safeParse(statusResponse)

    if (parsed.success) {
      await paymentStatusService.applyMidtransUpdate({
        order,
        transactionStatus: parsed.data.transaction_status,
        fraudStatus: parsed.data.fraud_status,
        grossAmount: parsed.data.gross_amount,
        transactionId: parsed.data.transaction_id,
        paymentType: parsed.data.payment_type,
        source: 'status_api',
        raw: statusResponse as Record<string, unknown>,
      })
    } else {
      console.error('unexpected midtrans status response', statusResponse)
    }
  } catch (err: unknown) {
    const httpStatusCode = (err as { httpStatusCode?: number })?.httpStatusCode
    if (httpStatusCode !== 404) {
      console.error('midtrans status check failed', err)
    }
  }

  const freshOrder = await paymentStatusService.findByMidtransOrderId(order_id)

  return sendRedirect(
    event,
    `/checkout/finish?orderId=${order.id}&status=${freshOrder?.status ?? order.status}`,
    302,
  )
})
