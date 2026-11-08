import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { SupabaseSettingsRepository } from '#server/repositories/supabase-settings.repository'
import { PaymentSettingsService } from '#server/services/payment-settings.service'

export async function usePaymentSettingsService(
  event: H3Event,
): Promise<PaymentSettingsService> {
  const client = await serverSupabaseClient(event)
  const repo = new SupabaseSettingsRepository(client)
  return new PaymentSettingsService(repo)
}
