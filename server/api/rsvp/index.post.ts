import { z } from 'zod'
import { useRsvpService } from '../../utils/rsvp-service'

const bodySchema = z.object({
  eventId: z.number(),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  email: z.email('Masukkan alamat email yang valid.'),
  organization: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => bodySchema.parse(b))
  const service = await useRsvpService(event)

  const rsvp = await service.createRsvp({
    ...body,
    origin: getRequestURL(event).origin,
  })

  return { success: true, token: rsvp.token }
})
