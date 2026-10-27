import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { SupabaseOrderRepository } from '#server/repositories/supabase-order.repository'
import { SupabaseTicketRepository } from '#server/repositories/supabase-ticket.repository'
import { OrderService } from '#server/services/order.service'
import { buildLogger } from '#server/services/logger.factory'

export function getMidtransConfig(): {
  serverKey: string
  clientKey: string
  isProduction: boolean
} {
  const config = useRuntimeConfig()
  return {
    serverKey: config.midtransServerKey,
    clientKey: config.midtransClientKey,
    isProduction: config.midtransIsProduction === 'true',
  }
}

export async function useOrderService(event: H3Event): Promise<OrderService> {
  const client = await serverSupabaseClient(event)
  const orderRepo = new SupabaseOrderRepository(client)
  const ticketRepo = new SupabaseTicketRepository(client)
  const midtransConfig = getMidtransConfig()
  const logger = buildLogger()
  return new OrderService(orderRepo, ticketRepo, midtransConfig, logger)
}
