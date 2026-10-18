import type {
  Event,
  CreateEventInput,
  UpdateEventInput,
  UserProfile,
  UpdateUserProfileInput,
  Rsvp,
  CreateRsvpInput,
} from '../domain/types'

export interface IEventRepository {
  findAll(): Promise<Event[]>
  findBySlug(slug: string): Promise<Event | null>
  findById(id: number): Promise<Event | null>
  create(payload: CreateEventInput): Promise<Event>
  update(id: number, payload: UpdateEventInput): Promise<Event>
  delete(id: number): Promise<void>
}

export interface IUserRepository {
  findById(id: string): Promise<UserProfile | null>
  findAll(): Promise<UserProfile[]>
  update(id: string, payload: UpdateUserProfileInput): Promise<UserProfile>
  updateRole(id: string, role: UserRole): Promise<UserProfile>
  upsert(payload: {
    id: string
    email: string
    name?: string | null
    role?: UserRole
  }): Promise<UserProfile>
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
