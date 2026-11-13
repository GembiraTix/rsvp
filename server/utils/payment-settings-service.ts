import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { SupabaseEventRepository } from '#server/repositories/supabase-event.repository'
import { SupabaseSettingsRepository } from '#server/repositories/supabase-settings.repository'
import { PaymentSettingsService } from '#server/services/payment-settings.service'

export async function usePaymentSettingsService(
  event: H3Event,
): Promise<PaymentSettingsService> {
  const client = await serverSupabaseClient(event)
  const settingsRepo = new SupabaseSettingsRepository(client)
  const eventRepo = new SupabaseEventRepository(client)
  return new PaymentSettingsService(settingsRepo, eventRepo)
}
