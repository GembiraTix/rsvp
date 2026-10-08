import type { IEventRepository } from '#server/repositories/interfaces'
import type {
  Event,
  CreateEventInput,
  UpdateEventInput,
} from '#server/domain/types'
import type { ILogger } from './logger.service'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export class EventService {
  constructor(
    private readonly eventRepo: IEventRepository,
    private readonly logger: ILogger,
  ) {}

  async getAllEvents(): Promise<Event[]> {
    this.logger.info('Fetching all events')
    return this.eventRepo.findAll()
  }

  async getEventBySlug(slug: string): Promise<Event | null> {
    this.logger.info('Fetching event by slug', { slug })
    return this.eventRepo.findBySlug(slug)
  }

  async getEventsByCreator(userId: string): Promise<Event[]> {
    this.logger.info('Fetching events by creator', { userId })
    return this.eventRepo.findByCreator(userId)
  }

  async createEvent(input: {
    title: string
    location: string
    startsAt: string
    endsAt?: string | null
    description?: string | null
    imageUrl?: string | null
    createdBy: string
  }): Promise<Event> {
    const slug = `${slugify(input.title)}-${Math.floor(1000 + Math.random() * 9000)}`

    const payload: CreateEventInput = {
      title: input.title,
      slug,
      location: input.location,
      starts_at: input.startsAt,
      ends_at: input.endsAt || null,
      description: input.description || null,
      image_url: input.imageUrl || null,
      created_by: input.createdBy,
    }

    this.logger.info('Creating new event', {
      title: input.title,
      slug,
      createdBy: input.createdBy,
    })
    const createdEvent = await this.eventRepo.create(payload)
    return createdEvent
  }

  async deleteEvent(id: number, userId: string): Promise<void> {
    const existing = await this.eventRepo.findById(id)
    if (!existing) {
      throw new Error('Acara tidak ditemukan')
    }

    if (existing.created_by !== userId) {
      throw new Error('Anda tidak memiliki izin untuk menghapus acara ini')
    }

    this.logger.info('Deleting event', { id, userId })
    await this.eventRepo.delete(id)
  }

  async updateEvent(
    id: number,
    userId: string,
    input: {
      title: string
      location: string
      startsAt: string
      endsAt?: string | null
      description?: string | null
      imageUrl?: string | null
    },
  ): Promise<Event> {
    const existing = await this.eventRepo.findById(id)
    if (!existing) {
      throw new Error('Acara tidak ditemukan')
    }

    if (existing.created_by !== userId) {
      throw new Error('Anda tidak memiliki izin untuk memperbarui acara ini')
    }

    const payload: UpdateEventInput = {
      title: input.title,
      location: input.location,
      starts_at: input.startsAt,
      ends_at: input.endsAt || null,
      description: input.description || null,
      image_url: input.imageUrl || null,
    }

    this.logger.info('Updating event', { id, title: input.title, userId })
    return this.eventRepo.update(id, payload)
  }
}
