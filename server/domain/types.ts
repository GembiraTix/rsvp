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
}

export type CreateEventInput = Omit<Event, 'id' | 'created_at'>
export type UpdateEventInput = Partial<Omit<Event, 'id' | 'created_at' | 'created_by'>>

export interface UserProfile {
  id: string
  email: string
  name: string | null
  created_at: string
}

export interface UpdateUserProfileInput {
  name?: string | null
  email?: string
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
