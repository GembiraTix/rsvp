import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import { useAdminUserService } from '#server/utils/admin-user-service'
import type { UserRole } from '#server/domain/types'

const createUserSchema = z.object({
  email: z.email('Format email tidak valid.'),
  name: z.string().min(1, 'Nama wajib diisi.'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.'),
  role: z.enum(['user', 'admin', 'super_admin'] as const).default('user'),
})

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
        'Akses ditolak: Hanya super admin yang dapat membuat pengguna baru.',
    })
  }

  const body = await readValidatedBody(event, (b) => createUserSchema.parse(b))
  const serviceRoleClient = serverSupabaseServiceRole(event)

  const { data: authUser, error: authError } =
    await serviceRoleClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: body.name,
        role: body.role,
      },
      app_metadata: {
        role: body.role,
      },
    })

  if (authError || !authUser.user) {
    throw createError({
      statusCode: 400,
      statusMessage: authError?.message || 'Gagal membuat pengguna.',
    })
  }

  const userService = useAdminUserService(event)
  const profile = await userService.updateProfile(authUser.user.id, {
    name: body.name,
    role: body.role as UserRole,
  })

  return { success: true, data: profile }
})
