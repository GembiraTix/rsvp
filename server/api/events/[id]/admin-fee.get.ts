import { z } from 'zod'
import { usePaymentSettingsService } from '#server/utils/payment-settings-service'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  const { auth } = event.context
  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const { data: params, error: paramsError } = await getValidatedRouterParams(
    event,
    paramsSchema.safeParse,
  )
  if (paramsError || !params) {
    throw createError({ statusCode: 404, statusMessage: 'Acara tidak ditemukan.' })
  }

  const service = await usePaymentSettingsService(event)
  const { fee, source } = await service.resolveAdminFee(params.id)

  return { success: true, data: { admin_fee: fee, fee_source: source } }
})
