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
}

export type CreateEventInput = Omit<Event, 'id' | 'created_at'>
export type UpdateEventInput = Partial<
  Omit<Event, 'id' | 'created_at' | 'created_by'>
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
export type TicketTypeKind = 'single' | 'couple' | 'berempat'

export type TicketType = {
  capacity: number | null
  created_at: string
  description: string | null
  event_id: number
  id: number
  is_active: boolean
  kind: TicketTypeKind
  max_qty: number
  min_qty: number
  multiple_of: number
  name: string
  price: number
  sort_order: number
  updated_at: string
}

export type CreateTicketTypeInput = Omit<
  TicketType,
  'id' | 'created_at' | 'updated_at'
>

export type UpdateTicketTypeInput = Partial<
  Omit<CreateTicketTypeInput, 'event_id' | 'sort_order'>
>
