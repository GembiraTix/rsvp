import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { SupabaseOrderRepository } from '#server/repositories/supabase-order.repository'
import { SupabaseTicketRepository } from '#server/repositories/supabase-ticket.repository'
import { SupabaseRsvpRepository } from '#server/repositories/supabase-rsvp.repository'
import { SupabaseEventRepository } from '#server/repositories/supabase-event.repository'
import { OrderService } from '#server/services/order.service'
import { buildLogger } from '#server/services/logger.factory'

export function getMidtransConfig(): {
  serverKey: string
  clientKey: string
  isProduction: boolean
  appUrl: string
} {
  const config = useRuntimeConfig()
  return {
    serverKey: config.midtransServerKey,
    clientKey: config.midtransClientKey,
    isProduction: config.midtransIsProduction === 'true',
    appUrl: config.public.appUrl,
  }
}

export async function useOrderService(event: H3Event): Promise<OrderService> {
  const client = await serverSupabaseClient(event)
  const orderRepo = new SupabaseOrderRepository(client)
  const ticketRepo = new SupabaseTicketRepository(client)
  const rsvpRepo = new SupabaseRsvpRepository(client)
  const eventRepo = new SupabaseEventRepository(client)
  const paymentSettingsService = await usePaymentSettingsService(event)
  const midtransConfig = getMidtransConfig()
  const logger = buildLogger()
  return new OrderService(
    orderRepo,
    ticketRepo,
    rsvpRepo,
    eventRepo,
    paymentSettingsService,
    midtransConfig,
    logger,
  )
}
