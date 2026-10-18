import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import { useAdminUserService } from '#server/utils/admin-user-service'
import type { UserRole } from '#server/domain/types'

const paramsSchema = z.object({
  id: z.uuid('ID pengguna tidak valid.'),
})

const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin', 'super_admin'] as const),
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
        'Akses ditolak: Hanya super admin yang dapat mengubah role pengguna.',
    })
  }

  const { id: targetUserId } = await getValidatedRouterParams(
    event,
    paramsSchema.parse,
  )
  const body = await readValidatedBody(event, (b) => updateRoleSchema.parse(b))

  const serviceRoleClient = serverSupabaseServiceRole(event)

  const { error: authError } =
    await serviceRoleClient.auth.admin.updateUserById(targetUserId, {
      app_metadata: { role: body.role },
      user_metadata: { role: body.role },
    })

  if (authError) {
    throw createError({
      statusCode: 400,
      statusMessage: `Gagal memperbarui metadata pengguna: ${authError.message}`,
    })
  }

  const userService = useAdminUserService(event)
  const updatedProfile = await userService.updateRole(
    targetUserId,
    body.role as UserRole,
  )

  return { success: true, data: updatedProfile }
})
