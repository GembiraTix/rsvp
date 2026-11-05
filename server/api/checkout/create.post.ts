import { z } from 'zod'
import { useOrderService } from '#server/utils/order-service'
import { useTicketTypeService } from '#server/utils/ticket-type-service'
import {
  CheckoutValidationError,
  resolveCheckoutLines,
} from '#server/services/checkout-validation'
import { normalizeWhatsapp } from '../../../shared/utils/whatsapp'

const attendeeSchema = z.object({
  name: z.string().trim().min(1, 'Nama lengkap wajib diisi.'),
  identityType: z.enum(['ktp', 'sim', 'paspor', 'kartu_pelajar']),
  identityNumber: z.string().trim().min(1, 'Nomor identitas wajib diisi.'),
  email: z.email('Masukkan alamat email yang valid.'),
  whatsapp: z.string().min(1, 'Nomor WhatsApp wajib diisi.'),
  gender: z.enum(['laki-laki', 'perempuan']),
})

const checkoutSchema = z.object({
  eventId: z.coerce.number().positive(),
  lines: z.array(
    z.object({
      ticketTypeId: z.coerce.number().positive(),
      qty: z.coerce.number().int().positive(),
      attendees: z.array(attendeeSchema),
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
    linesWithPrice = resolveCheckoutLines(
      ticketTypes,
      body.lines.map((line) => ({
        ticketTypeId: line.ticketTypeId,
        qty: line.qty,
      })),
    )
  } catch (err: unknown) {
    if (err instanceof CheckoutValidationError) {
      throw createError({
        statusCode: err.statusCode,
        statusMessage: err.message,
      })
    }
    throw err
  }

  const linesWithAttendees = linesWithPrice.map((line, i) => ({
    ...line,
    attendees: (body.lines[i]?.attendees ?? []).map((attendee) => ({
      ...attendee,
      whatsapp: normalizeWhatsapp(attendee.whatsapp),
    })),
  }))

  try {
    const result = await orderService.createOrder({
      eventId: body.eventId,
      userId: auth.user.sub,
      lines: linesWithAttendees,
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
    if (err instanceof CheckoutValidationError) {
      throw createError({
        statusCode: err.statusCode,
        statusMessage: err.message,
      })
    }
    const message =
      err instanceof Error ? err.message : 'Gagal membuat pesanan.'
    throw createError({
      statusCode: message.includes('tidak ditemukan') ? 404 : 400,
      statusMessage: message,
    })
  }
})
