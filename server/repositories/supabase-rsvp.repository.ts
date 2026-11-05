import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { IRsvpRepository } from './interfaces'
import type { Rsvp, RsvpWithEvent, CreateRsvpInput } from '../domain/types'

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

  async findById(id: number): Promise<Rsvp | null> {
    const { data, error } = await this.client
      .from('rsvps')
      .select('*')
      .eq('id', id)
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

  async findAttendingByEmail(email: string): Promise<RsvpWithEvent[]> {
    const { data, error } = await this.client
      .from('rsvps')
      .select('*, event:events(id, slug, title, location, starts_at, ends_at)')
      .eq('email', email)
      .eq('is_attending', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async countAttendingByEventId(eventId: number): Promise<number> {
    const { count, error } = await this.client
      .from('rsvps')
      .select('*', { head: true, count: 'exact' })
      .eq('event_id', eventId)
      .eq('is_attending', true)

    if (error) throw error
    return count ?? 0
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

  async findRegisteredEmails(
    eventId: number,
    emails: string[],
  ): Promise<string[]> {
    if (emails.length === 0) return []

    const wanted = new Set(emails.map((e) => e.trim().toLowerCase()))
    const { data, error } = await this.client
      .from('rsvps')
      .select('email')
      .eq('event_id', eventId)

    if (error) throw error
    return (data ?? [])
      .map((row) => (row.email ?? '').trim().toLowerCase())
      .filter((email) => email !== '' && wanted.has(email))
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

  async createBatch(input: {
    items: {
      event_id: number
      name: string
      email: string | null
      organization: string | null
      token: string
      is_attending: boolean
    }[]
  }): Promise<Rsvp[]> {
    const { data, error } = await this.client
      .from('rsvps')
      .insert(input.items)
      .select('*')

    if (error) throw error
    return (data ?? []) as unknown as Rsvp[]
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.client.from('rsvps').delete().eq('id', id)

    if (error) throw error
  }
}
