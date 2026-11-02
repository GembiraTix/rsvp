import { z } from 'zod'
import { useOrderService } from '#server/utils/order-service'
import { useTicketTypeService } from '#server/utils/ticket-type-service'
import {
  CheckoutValidationError,
  resolveCheckoutLines,
} from '#server/services/checkout-validation'

const checkoutSchema = z.object({
  eventId: z.coerce.number().positive(),
  lines: z.array(
    z.object({
      ticketTypeId: z.coerce.number().positive(),
      qty: z.coerce.number().int().positive(),
    }),
  ),
})

export default defineEventHandler(async (event) => {
  const { auth } = event.context
  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const body = await readValidatedBody(event, (b) => checkoutSchema.parse(b))

  if (!body.lines || body.lines.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Minimal satu tiket harus dipilih.',
    })
  }

  const orderService = await useOrderService(event)
  const ticketTypeService = await useTicketTypeService(event)

  const ticketTypes = await ticketTypeService.findByEventId(body.eventId)

  if (ticketTypes.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Acara tidak ditemukan atau tidak menjual tiket.',
    })
  }

  let linesWithPrice
  try {
    linesWithPrice = resolveCheckoutLines(ticketTypes, body.lines)
  } catch (err: unknown) {
    if (err instanceof CheckoutValidationError) {
      throw createError({
        statusCode: err.statusCode,
        statusMessage: err.message,
      })
    }
    throw err
  }

  try {
    const result = await orderService.createOrder({
      eventId: body.eventId,
      userId: auth.user.sub,
      lines: linesWithPrice,
    })

    return {
      success: true,
      data: {
        orderId: result.order.id,
        snapToken: result.snapToken,
        redirectUrl: result.redirectUrl,
      },
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Gagal membuat pesanan.'
    throw createError({
      statusCode: message.includes('tidak ditemukan') ? 404 : 400,
      statusMessage: message,
    })
  }
})
