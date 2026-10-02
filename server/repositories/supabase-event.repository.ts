import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { IEventRepository } from './interfaces'
import type { Event, CreateEventInput, UpdateEventInput } from '../domain/types'

export class SupabaseEventRepository implements IEventRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findAll(): Promise<Event[]> {
    const { data, error } = await this.client
      .from('events')
      .select('*')
      .order('starts_at', { ascending: true })

    if (error) throw error
    return data ?? []
  }

  async findBySlug(slug: string): Promise<Event | null> {
    const { data, error } = await this.client
      .from('events')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async findById(id: number): Promise<Event | null> {
    const { data, error } = await this.client
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async findByCreator(userId: string): Promise<Event[]> {
    const { data, error } = await this.client
      .from('events')
      .select('*')
      .eq('created_by', userId)
      .order('starts_at', { ascending: true })

    if (error) throw error
    return data ?? []
  }

  async create(payload: CreateEventInput): Promise<Event> {
    const { data, error } = await this.client
      .from('events')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  async update(id: number, payload: UpdateEventInput): Promise<Event> {
    const { data, error } = await this.client
      .from('events')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.client
      .from('events')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
