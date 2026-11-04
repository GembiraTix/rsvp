export interface Event {
  id: number
  slug: string
  title: string | null
  description: string | null
  location: string | null
  starts_at: string | null
  ends_at: string | null
  image_url: string | null
  created_by: string
  created_at: string
  deleted_at?: string | null
  registration_limit?: number | null
  is_draft: boolean
}

export interface UpdateableEvent {
  created_at?: string | undefined
  created_by?: string | undefined
  deleted_at?: string | null | undefined
  description?: string | null | undefined
  ends_at?: string | null | undefined
  id?: number | undefined
  image_url?: string | null | undefined
  is_draft?: boolean | undefined
  location?: string | null | undefined
  registration_limit?: number | null | undefined
  slug?: string | undefined
  starts_at?: string | null | undefined
  title?: string | null | undefined
}

export interface InsertableEvent {
  created_at?: string | undefined
  created_by: string
  deleted_at?: string | null | undefined
  description?: string | null | undefined
  ends_at?: string | null | undefined
  id?: number | undefined
  image_url?: string | null | undefined
  is_draft: boolean
  location?: string | null | undefined
  registration_limit?: number | null | undefined
  slug: string
  starts_at?: string | null | undefined
  title?: string | null | undefined
}

export type CreateEventInput = Omit<InsertableEvent, 'id' | 'created_at'>
export type UpdateEventInput = Partial<
  Omit<UpdateableEvent, 'id' | 'created_at' | 'created_by'>
>

import type { Database } from '~/types/database.types'

export type UserRole = Database['public']['Enums']['user_role']

export interface UserProfile {
  id: string
  email: string
  name: string | null
  role: UserRole
  created_at: string
}

export interface UpdateUserProfileInput {
  name?: string | null
  email?: string
  role?: UserRole
}

export interface Rsvp {
  id: number
  event_id: number | null
  name: string
  email: string | null
  organization: string | null
  token: string
  is_attending: boolean
  created_at: string
}

export type CreateRsvpInput = Omit<Rsvp, 'id' | 'created_at'>
export type UpdateRsvpInput = Partial<Omit<Rsvp, 'id' | 'created_at' | 'token'>>
