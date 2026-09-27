import { z } from 'zod'
import { serverSupabaseUser } from '#supabase/server'
import { useUserService } from '../../utils/user-service'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.'),
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const body = await readValidatedBody(event, (b) =>
    updateProfileSchema.parse(b),
  )
  const service = await useUserService(event)

  const updatedProfile = await service.updateProfile(user.sub || user.id, {
    name: body.name,
    email: user.email,
  })

  return { success: true, data: updatedProfile }
})
