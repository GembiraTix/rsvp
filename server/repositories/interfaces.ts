import type { Event, CreateEventInput, UserProfile, UpdateUserProfileInput, Rsvp, CreateRsvpInput } from '../domain/types'

export interface IEventRepository {
  findAll(): Promise<Event[]>
  findBySlug(slug: string): Promise<Event | null>
  findById(id: number): Promise<Event | null>
  findByCreator(userId: string): Promise<Event[]>
  create(payload: CreateEventInput): Promise<Event>
  delete(id: number): Promise<void>
}

export interface IUserRepository {
  findById(id: string): Promise<UserProfile | null>
  update(id: string, payload: UpdateUserProfileInput): Promise<UserProfile>
  upsert(payload: { id: string; email: string; name?: string | null }): Promise<UserProfile>
}

export interface IRsvpRepository {
  findByToken(token: string): Promise<Rsvp | null>
  findByEventId(eventId: number): Promise<Rsvp[]>
  findByEmail(email: string): Promise<Rsvp[]>
  findByEventAndEmail(eventId: number, email: string): Promise<Rsvp | null>
  create(payload: CreateRsvpInput): Promise<Rsvp>
  cancel(token: string): Promise<void>
  delete(id: number): Promise<void>
}

export interface IEmailLogRepository {
  log(entry: {
    rsvpId: number
    email: string
    subject: string
    status: 'sent' | 'failed'
    messageId?: string | null
    error?: string
  }): Promise<void>
}
