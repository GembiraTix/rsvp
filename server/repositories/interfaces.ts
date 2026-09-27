import type { Event, CreateEventInput, UserProfile, UpdateUserProfileInput } from '../domain/types'

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
