import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { IOrderRepository } from './interfaces'
import type {
  Order,
  OrderItem,
  OrderWithEvent,
  OrderStatus,
  PaymentStatus,
} from '../domain/types'

type OrderInsert = Database['public']['Tables']['orders']['Insert']

export class SupabaseOrderRepository implements IOrderRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(input: {
    id: string
    order_number: string
    event_id: number
    user_id: string
    subtotal: number
    admin_fee: number
    total: number
    expires_at: string
    token: string
    midtrans_order_id: string
    checkout_url: string
    status: OrderStatus
    payment_status: PaymentStatus
  }): Promise<Order> {
    const payload: OrderInsert = {
      id: input.id,
      order_number: input.order_number,
      event_id: input.event_id,
      user_id: input.user_id,
      subtotal: input.subtotal,
      admin_fee: input.admin_fee,
      total: input.total,
      expires_at: input.expires_at,
      token: input.token,
      midtrans_order_id: input.midtrans_order_id,
      checkout_url: input.checkout_url,
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

  async findByUser(userId: string): Promise<OrderWithEvent[]> {
    const { data, error } = await this.client
      .from('orders')
      .select('*, event:events(id, slug, title, starts_at, location)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as unknown as OrderWithEvent[]
  }

  async updateCheckoutUrl(id: string, checkoutUrl: string): Promise<void> {
    const { error } = await this.client
      .from('orders')
      .update({ checkout_url: checkoutUrl, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }

  async updateStatus(
    id: string,
    payload: {
      status: OrderStatus
      payment_status: PaymentStatus
      paid_at?: string
      midtrans_transaction_id?: string | null
    },
    guard?: {
      onlyIfPaymentStatusIn?: PaymentStatus[]
      unlessPaymentStatusIn?: PaymentStatus[]
    },
  ): Promise<boolean> {
    let query = this.client
      .from('orders')
      .update({
        status: payload.status,
        payment_status: payload.payment_status,
        ...(payload.paid_at ? { paid_at: payload.paid_at } : {}),
        ...(payload.midtrans_transaction_id !== undefined
          ? { midtrans_transaction_id: payload.midtrans_transaction_id }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (guard?.onlyIfPaymentStatusIn?.length) {
      query = query.in('payment_status', guard.onlyIfPaymentStatusIn)
    }
    if (guard?.unlessPaymentStatusIn?.length) {
      query = query.not(
        'payment_status',
        'in',
        `(${guard.unlessPaymentStatusIn.join(',')})`,
      )
    }

    const { data, error } = await query.select('id')

    if (error) throw error
    return data.length > 0
  }
  async findByMidtransOrderId(midtransOrderId: string): Promise<Order | null> {
    const { data, error } = await this.client
      .from('orders')
      .select('*')
      .eq('midtrans_order_id', midtransOrderId)
      .single()

    if (error) throw error

    return data as unknown as Order | null
  }

  async findOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await this.client
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (error) throw error

    return data as unknown as OrderItem[]
  }
}
