import { z } from 'zod'
import { useUserService } from '../../utils/user-service'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.'),
})

export default defineEventHandler(async (event) => {
  const { auth } = event.context
  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const body = await readValidatedBody(event, (b) =>
    updateProfileSchema.parse(b),
  )
  const service = await useUserService(event)

  const updatedProfile = await service.updateProfile(auth.user.sub, {
    name: body.name,
    email: auth.user.email,
  })

  return { success: true, data: updatedProfile }
})
