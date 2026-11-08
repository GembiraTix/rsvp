import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { IPaymentEventRepository } from './interfaces'

type PaymentEventInsert =
  Database['public']['Tables']['payment_events']['Insert']

export class SupabasePaymentEventRepository implements IPaymentEventRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async existsByTransactionAndStatus(
    midtransTransactionId: string,
    eventType: string,
  ): Promise<boolean> {
    const { data, error } = await this.client
      .from('payment_events')
      .select('id')
      .eq('midtrans_transaction_id', midtransTransactionId)
      .eq('event_type', eventType)
      .eq('processed', true)
      .limit(1)

    if (error) throw error
    return data.length > 0
  }

  async create(input: {
    order_id: string | null
    midtrans_order_id: string | null
    midtrans_transaction_id: string | null
    event_type: string
    payload: Record<string, unknown>
    signature_valid?: boolean | null
  }): Promise<string> {
    const { data, error } = await this.client
      .from('payment_events')
      .insert({
        order_id: input.order_id,
        midtrans_order_id: input.midtrans_order_id,
        midtrans_transaction_id: input.midtrans_transaction_id,
        event_type: input.event_type,
        payload: input.payload as unknown as PaymentEventInsert['payload'],
        signature_valid: input.signature_valid ?? null,
        processed: false,
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  async markProcessed(id: string, error?: string): Promise<void> {
    const { error: updateError } = await this.client
      .from('payment_events')
      .update({
        processed: !error,
        error: error ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError
  }
}
