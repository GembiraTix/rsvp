import { z } from 'zod'
import { useEventService } from '#server/utils/event-service'

const createEventSchema = z.object({
  title: z.string().min(1, 'Judul acara wajib diisi.'),
  location: z.string().min(1, 'Lokasi wajib diisi.'),
  startsAt: z.string().min(1, 'Tanggal awal wajib diisi.'),
  endsAt: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z
    .url('URL gambar tidak valid.')
    .optional()
    .or(z.literal(''))
    .nullable(),
})

export default defineEventHandler(async (event) => {
  const { auth } = event.context
  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const body = await readValidatedBody(event, (b) => createEventSchema.parse(b))
  const service = await useEventService(event)

  const createdEvent = await service.createEvent({
    title: body.title,
    location: body.location,
    startsAt: body.startsAt,
    endsAt: body.endsAt,
    description: body.description,
    imageUrl: body.imageUrl,
    createdBy: auth.user.sub,
  })

  return { success: true, data: createdEvent }
})
