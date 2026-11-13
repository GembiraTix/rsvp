import { z } from 'zod'
import { usePaymentSettingsService } from '#server/utils/payment-settings-service'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const querySchema = z.object({
  subtotal: z.coerce.number().int().min(0).default(0),
})

export default defineEventHandler(async (event) => {
  const { data: params, error: paramsError } = await getValidatedRouterParams(
    event,
    paramsSchema.safeParse,
  )
  if (paramsError || !params) {
    throw createError({ statusCode: 404, statusMessage: 'Acara tidak ditemukan.' })
  }

  const { data: query, error: queryError } = await getValidatedQuery(
    event,
    querySchema.safeParse,
  )
  if (queryError || !query) {
    throw createError({ statusCode: 400, statusMessage: 'Parameter tidak valid.' })
  }

  const service = await usePaymentSettingsService(event)
  const { fee, source } = await service.resolveAdminFee(params.id, query.subtotal)

  return { success: true, data: { admin_fee: fee, fee_source: source } }
})
