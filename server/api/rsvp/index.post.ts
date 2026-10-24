import { z } from 'zod'
import { useRsvpService } from '#server/utils/rsvp-service'

const bodySchema = z.object({
  eventId: z.number(),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  email: z.email('Masukkan alamat email yang valid.'),
  organization: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => bodySchema.parse(b))
  const service = await useRsvpService(event)

  try {
    const rsvp = await service.createRsvp({
      ...body,
      origin: getRequestURL(event).origin,
    })

    return { success: true, token: rsvp.token }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat reservasi.'
    const statusCode = message === 'Kuota penuh' ? 409 : 400
    throw createError({
      statusCode,
      statusMessage: message,
    })
  }
})
