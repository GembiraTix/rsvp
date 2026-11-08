import type { IEventRepository } from '#server/repositories/interfaces'
import type {
  Event,
  CreateEventInput,
  UpdateEventInput,
} from '#server/domain/types'
import type { ILogger } from './logger.service'
import { nanoid } from 'nanoid'

type EventGetAllOptions = {
  withDraft?: boolean
}

export class EventService {
  constructor(
    private readonly eventRepo: IEventRepository,
    private readonly logger: ILogger,
  ) {}

  async getAllEvents({ withDraft }: EventGetAllOptions): Promise<Event[]> {
    this.logger.info('Fetching all events')
    return this.eventRepo.find({ withDraft })
  }

  async getEventById(id: number): Promise<Event | null> {
    this.logger.info('Fetching event by id', { id })
    return this.eventRepo.findById(id)
  }

  async getEventBySlug(slug: string): Promise<Event | null> {
    this.logger.info('Fetching event by slug', { slug })
    return this.eventRepo.findBySlug(slug)
  }

  async createEvent(input: {
    title: string
    location: string
    startsAt: string
    endsAt?: string | null
    description?: string | null
    imageUrl?: string | null
    customQuestionLabel?: string | null
    customQuestionRequired?: boolean
    createdBy: string
  }): Promise<Event> {
    const slug = nanoid()

    const payload: CreateEventInput = {
      title: input.title,
      slug,
      location: input.location,
      starts_at: input.startsAt,
      ends_at: input.endsAt || null,
      description: input.description || null,
      image_url: input.imageUrl || null,
      custom_question_label: input.customQuestionLabel?.trim() || null,
      custom_question_required: input.customQuestionRequired ?? false,
      created_by: input.createdBy,
      is_draft: true,
    }

    this.logger.info('Creating new event', {
      title: input.title,
      slug,
      createdBy: input.createdBy,
    })
    const createdEvent = await this.eventRepo.create(payload)
    return createdEvent
  }

  async deleteEvent(
    id: number,
    currentUser: { id: string; role?: string | null },
  ): Promise<void> {
    if (currentUser.role !== 'super_admin') {
      throw new Error(
        'Hanya super admin yang memiliki izin untuk menghapus acara.',
      )
    }

    const existing = await this.eventRepo.findById(id)
    if (!existing) {
      throw new Error('Acara tidak ditemukan')
    }

    this.logger.info('Deleting event', { id, userId: currentUser.id })
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
      registrationLimit?: number | null
      isDraft?: boolean
      customQuestionLabel?: string | null
      customQuestionRequired?: boolean
    },
  ): Promise<Event> {
    const existing = await this.eventRepo.findById(id)
    if (!existing) {
      throw new Error('Acara tidak ditemukan')
    }

    const payload: UpdateEventInput = {
      title: input.title,
      location: input.location,
      starts_at: input.startsAt,
      ends_at: input.endsAt || null,
      description: input.description || null,
      image_url: input.imageUrl || null,
      custom_question_label: input.customQuestionLabel?.trim() || null,
      custom_question_required: input.customQuestionRequired ?? false,
    }

    if (input.registrationLimit !== undefined) {
      payload.registration_limit = input.registrationLimit
    }

    if (input.isDraft !== undefined) {
      payload.is_draft = input.isDraft
    }

    this.logger.info('Updating event', { id, title: input.title, userId })
    return this.eventRepo.update(id, payload)
  }

  async updateRegistrationLimit(
    id: number,
    limit: number | null,
  ): Promise<Event> {
    const existing = await this.eventRepo.findById(id)
    if (!existing) {
      throw new Error('Acara tidak ditemukan')
    }

    this.logger.info('Updating event registration limit', { id, limit })
    return this.eventRepo.updateRegistrationLimit(id, limit)
  }

  async updateDraftStatus(id: number, isDraft: boolean) {
    this.eventRepo.update(id, { is_draft: isDraft })
  }
}
