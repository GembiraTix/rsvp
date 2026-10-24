import { z } from 'zod'
import { useEventService } from '#server/utils/event-service'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const updateEventSchema = z.object({
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
  registrationLimit: z
    .number()
    .positive('Batas pendaftaran tidak boleh negatif.')
    .optional()
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

  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, (b) => updateEventSchema.parse(b))
  const service = await useEventService(event)

  try {
    const updatedEvent = await service.updateEvent(id, auth.user.sub, {
      title: body.title,
      location: body.location,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      description: body.description,
      imageUrl: body.imageUrl,
      registrationLimit: body.registrationLimit,
    })

    return { success: true, data: updatedEvent }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Gagal memperbarui acara'
    const statusCode = message.includes('izin')
      ? 403
      : message.includes('tidak ditemukan')
        ? 404
        : 400
    throw createError({
      statusCode,
      statusMessage: message,
    })
  }
})
