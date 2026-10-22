import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { ITicketTypeRepository } from './interfaces'
import type {
  TicketType,
  CreateTicketTypeInput,
  UpdateTicketTypeInput,
} from '../domain/types'

export class SupabaseTicketTypeRepository implements ITicketTypeRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByEventId(eventId: number): Promise<TicketType[]> {
    const { data, error } = await this.client
      .from('ticket_types')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (error) throw error
    return data ?? []
  }

  async findById(id: number): Promise<TicketType | null> {
    const { data, error } = await this.client
      .from('ticket_types')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async create(payload: CreateTicketTypeInput): Promise<TicketType> {
    const { data, error } = await this.client
      .from('ticket_types')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  async update(id: number, payload: UpdateTicketTypeInput): Promise<TicketType> {
    const { data, error } = await this.client
      .from('ticket_types')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.client.from('ticket_types').delete().eq('id', id)

    if (error) throw error
  }

  async hasOrders(ticketTypeId: number): Promise<boolean> {
    const { count, error } = await this.client
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('ticket_type_id', ticketTypeId)

    if (error) throw error
    return (count ?? 0) > 0
  }
}
