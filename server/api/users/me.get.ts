import { serverSupabaseUser } from '#supabase/server'
import { useUserService } from '../../utils/user-service'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const service = await useUserService(event)
  const profile = await service.getProfile(user.sub)

  return { success: true, data: profile }
})
