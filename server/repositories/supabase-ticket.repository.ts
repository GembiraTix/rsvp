import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { ITicketRepository } from './interfaces'
import type { OrderItem, Ticket } from '../domain/types'

type OrderItemInsert =
  Database['public']['Tables']['order_items']['Insert']
type TicketInsert = Database['public']['Tables']['tickets']['Insert']

export class SupabaseTicketRepository implements ITicketRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async createOrderItems(input: {
    order_id: string
    items: {
      ticket_type_id: number
      qty: number
      unit_price: number
      total: number
      attendee_data: Record<string, unknown>
    }[]
  }): Promise<OrderItem[]> {
    const payload: OrderItemInsert[] = input.items.map((item) => ({
      order_id: input.order_id,
      ticket_type_id: item.ticket_type_id,
      qty: item.qty,
      unit_price: item.unit_price,
      total: item.total,
      attendee_data: item.attendee_data as NonNullable<
        Database['public']['Tables']['order_items']['Insert']['attendee_data']
      >,
    }))

    const { data, error } = await this.client
      .from('order_items')
      .insert(payload)
      .select('*')

    if (error) throw error
    return (data ?? []) as unknown as OrderItem[]
  }

  async createTickets(input: {
    order_id: string
    user_id: string
    items: {
      ticket_type_id: number
      qty: number
      attendee_name: string
      attendee_email: string
      attendee_phone: string | null
    }[]
  }): Promise<Ticket[]> {
    const rows: TicketInsert[] = []

    for (const item of input.items) {
      for (let i = 0; i < item.qty; i += 1) {
        rows.push({
          order_id: input.order_id,
          ticket_type_id: item.ticket_type_id,
          attendee_name: item.attendee_name,
          attendee_email: item.attendee_email,
          attendee_phone: item.attendee_phone,
          checkin_by: input.user_id,
          fields: {} as Database['public']['Tables']['tickets']['Insert']['fields'],
        })
      }
    }

    const { data, error } = await this.client
      .from('tickets')
      .insert(rows)
      .select('*')

    if (error) throw error
    return (data ?? []) as unknown as Ticket[]
  }

  async findTicketsByOrderId(orderId: string): Promise<Ticket[]> {
    const { data, error } = await this.client
      .from('tickets')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as unknown as Ticket[]
  }
}
