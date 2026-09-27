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
