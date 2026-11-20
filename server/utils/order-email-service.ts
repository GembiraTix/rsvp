import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { SupabaseEmailLogRepository } from '#server/repositories/supabase-emaillog.repository'
import { OrderEmailService } from '#server/services/order-email.service'
import { useEmailService } from '#server/utils/email-service'
import { getMidtransConfig } from '#server/utils/order-service'
import { buildLogger } from '#server/services/logger.factory'

// E-ticket emails fire from the settlement flow (Midtrans webhook / finish
// endpoint), which carries no user session — service-role client.
export function useOrderEmailService(event: H3Event): OrderEmailService {
  const client = serverSupabaseServiceRole(event)
  return new OrderEmailService(
    useEmailService(),
    new SupabaseEmailLogRepository(client),
    getMidtransConfig().appUrl,
    buildLogger(),
  )
}
