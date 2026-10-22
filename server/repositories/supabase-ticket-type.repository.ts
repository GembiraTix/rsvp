import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { ITicketTypeRepository } from './interfaces'
import type { TicketType, CreateTicketTypeInput } from '../domain/types'

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
}
