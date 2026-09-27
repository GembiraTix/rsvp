import { useUserService } from '../../utils/user-service'

export default defineEventHandler(async (event) => {
  const { auth } = event.context

  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const service = await useUserService(event)
  const profile = await service.getProfile(auth.user.sub)

  return { success: true, data: profile }
})
