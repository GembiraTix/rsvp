import { z } from 'zod'
import { usePaymentSettingsService } from '#server/utils/payment-settings-service'

const bodySchema = z.object({
  admin_fee: z.number().int().min(0),
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
        'Akses ditolak: Hanya super admin yang dapat mengubah pengaturan.',
    })
  }

  const { data: body, error: bodyError } = await readValidatedBody(
    event,
    bodySchema.safeParse,
  )
  if (bodyError || !body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Biaya layanan tidak valid.',
    })
  }

  const service = await usePaymentSettingsService(event)
  await service.setGlobalAdminFee(body.admin_fee)

  return { success: true, data: { admin_fee: body.admin_fee } }
})
