import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { ITicketRepository } from './interfaces'
import type {
  AttendeeGender,
  IdentityType,
  OrderItem,
  Ticket,
  TicketWithTypeName,
} from '../domain/types'

type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
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
    }[]
  }): Promise<OrderItem[]> {
    const payload: OrderItemInsert[] = input.items.map((item) => ({
      order_id: input.order_id,
      ticket_type_id: item.ticket_type_id,
      qty: item.qty,
      unit_price: item.unit_price,
      total: item.total,
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
      attendees: {
        name: string
        email: string
        phone: string | null
        identity_type: IdentityType
        identity_number: string
        whatsapp: string
        gender: AttendeeGender
      }[]
    }[]
  }): Promise<Ticket[]> {
    const rows: TicketInsert[] = []

    for (const item of input.items) {
      for (const attendee of item.attendees) {
        rows.push({
          order_id: input.order_id,
          ticket_type_id: item.ticket_type_id,
          attendee_name: attendee.name,
          attendee_email: attendee.email,
          attendee_phone: attendee.phone,
          identity_type: attendee.identity_type,
          identity_number: attendee.identity_number,
          whatsapp: attendee.whatsapp,
          gender: attendee.gender,
          checkin_by: input.user_id,
          fields:
            {} as Database['public']['Tables']['tickets']['Insert']['fields'],
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

  async findTicketsByOrderId(orderId: string): Promise<TicketWithTypeName[]> {
    const { data, error } = await this.client
      .from('tickets')
      .select('*, ticket_type:ticket_types(name)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as unknown as TicketWithTypeName[]
  }

  async countPendingOrderTicketsByEventId(eventId: number): Promise<number> {
    const { count, error } = await this.client
      .from('tickets')
      .select('id, orders!inner(event_id, payment_status, expires_at)', {
        count: 'exact',
        head: true,
      })
      .eq('orders.event_id', eventId)
      .in('orders.payment_status', ['pending', 'awaiting_payment'])
      .gt('orders.expires_at', new Date().toISOString())

    if (error) throw error
    return count ?? 0
  }

  async deleteByOrderId(orderId: string): Promise<void> {
    const { error } = await this.client
      .from('tickets')
      .delete()
      .eq('order_id', orderId)

    if (error) throw error
  }
}
