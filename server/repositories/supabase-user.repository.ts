import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { IUserRepository } from './interfaces'
import type { UserProfile, UpdateUserProfileInput } from '../domain/types'

export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<UserProfile | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async findAll(): Promise<UserProfile[]> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  async update(
    id: string,
    payload: UpdateUserProfileInput,
  ): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('users')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  async updateRole(id: string, role: UserRole): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('users')
      .update({ role })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  async upsert(payload: {
    id: string
    email: string
    name?: string | null
    role?: UserRole
  }): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('users')
      .upsert(payload)
      .select('*')
      .single()

    if (error) throw error
    return data
  }
}
