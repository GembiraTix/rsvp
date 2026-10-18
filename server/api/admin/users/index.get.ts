import { useAdminUserService } from '#server/utils/admin-user-service'

export default defineEventHandler(async (event) => {
  const { auth } = event.context

  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  if (auth.role !== 'super_admin') {
    throw createError({
      statusCode: 403,
      statusMessage:
        'Akses ditolak: Hanya super admin yang dapat mengakses daftar pengguna.',
    })
  }

  const service = useAdminUserService(event)
  const users = await service.getAllUsers()

  return { success: true, data: users }
})
