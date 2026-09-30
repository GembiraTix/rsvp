import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { IRsvpRepository } from './interfaces'
import type { Rsvp, CreateRsvpInput } from '../domain/types'

export class SupabaseRsvpRepository implements IRsvpRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByToken(token: string): Promise<Rsvp | null> {
    const { data, error } = await this.client
      .from('rsvps')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async findByEventId(eventId: number): Promise<Rsvp[]> {
    const { data, error } = await this.client
      .from('rsvps')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  }

  async findByEmail(email: string): Promise<Rsvp[]> {
    const { data, error } = await this.client
      .from('rsvps')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  async findByEventAndEmail(
    eventId: number,
    email: string,
  ): Promise<Rsvp | null> {
    const { data, error } = await this.client
      .from('rsvps')
      .select('*')
      .eq('event_id', eventId)
      .eq('email', email)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async create(payload: CreateRsvpInput): Promise<Rsvp> {
    const { data, error } = await this.client
      .from('rsvps')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  async cancel(token: string): Promise<void> {
    const { error } = await this.client
      .from('rsvps')
      .update({ is_attending: false })
      .eq('token', token)

    if (error) throw error
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.client.from('rsvps').delete().eq('id', id)

    if (error) throw error
  }
}
