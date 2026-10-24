import { z } from 'zod'

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
  const body = await readValidatedBody(event, (b) => checkoutSchema.parse(b))

  if (!body.lines || body.lines.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Minimal satu tiket harus dipilih.',
    })
  }

  // Stage 1 stub: return mock checkout data without auth, DB, or Midtrans.
  // Real implementation (Stage 2) will create an order, call Midtrans Snap,
  // and return the actual snapToken and redirectUrl.
  return {
    success: true,
    data: {
      orderId: 'STUB-ORDER-ID',
      snapToken: 'STUB-SNAP-TOKEN',
      redirectUrl: 'https://sandbox.midtrans.com/',
    },
  }
})
