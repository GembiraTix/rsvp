import { z } from 'zod'
import { useOrderService } from '#server/utils/order-service'
import { useTicketTypeService } from '#server/utils/ticket-type-service'

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

  // TODO: decide what to do if we receive a request to check out tickets for an event that has none
  const ticketTypes = await ticketTypeService.findByEventId(body.eventId)

  // turn IDs into ticket types
  const linesWithPrice = body.lines.map((line) => {
    const ticketType = ticketTypes.find((tt) => tt.id == line.ticketTypeId)

    if (!ticketType) throw new Error('nonexistent ticket type id') // TODO: decide what to do if client sends a nonexistent ticketTypeId
    if (ticketType.price < 0) throw new Error('invalid ticket type price')

    return {
      ticketTypeId: ticketType.id,
      name: ticketType.name,
      unitPrice: ticketType.price,
      qty: line.qty,
    }
  })

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
