import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { IOrderRepository } from './interfaces'
import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
} from '../domain/types'

type OrderInsert = Database['public']['Tables']['orders']['Insert']

export class SupabaseOrderRepository implements IOrderRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(input: {
    order_number: string
    event_id: number
    user_id: string
    subtotal: number
    admin_fee: number
    total: number
    expires_at: string
    token: string
    status: OrderStatus
    payment_status: PaymentStatus
  }): Promise<Order> {
    const payload: OrderInsert = {
      order_number: input.order_number,
      event_id: input.event_id,
      user_id: input.user_id,
      subtotal: new Date().toISOString(),
      admin_fee: input.admin_fee,
      total: input.total,
      expires_at: input.expires_at,
      token: input.token,
      checkout_url: '',
      status: input.status,
      payment_status: input.payment_status,
    }

    const { data, error } = await this.client
      .from('orders')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error
    return data as unknown as Order
  }

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.client
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return (data ?? null) as unknown as Order | null
  }

  async findByUser(userId: string): Promise<Order[]> {
    const { data, error } = await this.client
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as unknown as Order[]
  }

  async updateStatus(
    id: string,
    payload: {
      status: OrderStatus
      payment_status: PaymentStatus
    },
  ): Promise<void> {
    const { error } = await this.client
      .from('orders')
      .update({
        status: payload.status,
        payment_status: payload.payment_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
  }

  async findByMidtransOrderId(midtransOrderId: string): Promise<Order | null> {
    const { data, error } = await this.client
      .from('orders')
      .select('*')
      .eq('midtrans_order_id', midtransOrderId)
      .single()

    if (error) throw error

    return data
  }

  async findOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await this.client
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (error) throw error

    return data // TODO: add types Record<string, unknown> for jsonb columns
  }

  async updateMidtrans(
    id: string,
    payload: {
      midtrans_order_id: string
      midtrans_transaction_id: string | null
      checkout_url: string | null
    },
  ): Promise<void> {
    const { error } = await this.client
      .from('orders')
      .update({
        midtrans_order_id: payload.midtrans_order_id,
        midtrans_transaction_id: payload.midtrans_transaction_id ?? undefined,
        checkout_url: payload.checkout_url ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
  }
}
