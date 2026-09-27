import type { Event, CreateEventInput } from '../domain/types'

export interface IEventRepository {
  findAll(): Promise<Event[]>
  findBySlug(slug: string): Promise<Event | null>
  findById(id: number): Promise<Event | null>
  findByCreator(userId: string): Promise<Event[]>
  create(payload: CreateEventInput): Promise<Event>
  delete(id: number): Promise<void>
}
