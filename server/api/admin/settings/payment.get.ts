import { usePaymentSettingsService } from '#server/utils/payment-settings-service'

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
        'Akses ditolak: Hanya super admin yang dapat mengakses pengaturan.',
    })
  }

  const service = await usePaymentSettingsService(event)
  const adminFee = await service.getGlobalAdminFee()

  return { success: true, data: { admin_fee: adminFee } }
})
