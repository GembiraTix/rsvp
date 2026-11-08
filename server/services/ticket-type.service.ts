import type {
  IEventRepository,
  ITicketTypeRepository,
} from '#server/repositories/interfaces'
import type {
  TicketType,
  UserRole,
  CreateTicketTypeInput,
  UpdateTicketTypeInput,
} from '#server/domain/types'
import type { ILogger } from './logger.service'

const DEFAULT_MAX_QTY = 10

export interface CurrentUser {
  id: string
  role?: UserRole | null
}

export interface DeleteTicketTypeResult {
  deleted: boolean
  deactivated: boolean
  ticketType: TicketType
}

function isForeignKeyViolation(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false
  }

  const { code, message } = err as { code?: string; message?: string }

  return (
    code === '23503' ||
    (typeof message === 'string' && message.includes('foreign key'))
  )
}

export class TicketTypeService {
  constructor(
    private readonly ticketTypeRepo: ITicketTypeRepository,
    private readonly eventRepo: IEventRepository,
    private readonly logger: ILogger,
  ) {}

  async getTicketTypesByEventSlug(
    slug: string,
    currentUser: CurrentUser,
  ): Promise<TicketType[]> {
    const event = await this.eventRepo.findBySlug(slug)
    if (!event) {
      throw new Error('Acara tidak ditemukan')
    }

    this.assertCanManage(event.created_by, currentUser)

    this.logger.info('Fetching ticket types', {
      eventId: event.id,
      userId: currentUser.id,
    })

    return this.ticketTypeRepo.findByEventId(event.id)
  }

  async getPublicTicketTypesByEventSlug(slug: string): Promise<TicketType[]> {
    const event = await this.eventRepo.findBySlug(slug)
    if (!event) {
      throw new Error('Acara tidak ditemukan')
    }

    this.logger.info('Fetching public ticket types', { eventId: event.id })

    return this.ticketTypeRepo.findActiveByEventId(event.id)
  }

  async findByEventId(eventId: number): Promise<TicketType[]> {
    const event = await this.eventRepo.findById(eventId)
    if (!event) {
      throw new Error('Acara tidak ditemukan')
    }

    return this.ticketTypeRepo.findByEventId(event.id)
  }

  async getEventById(eventId: number): Promise<{
    id: number
    slug: string
    title: string | null
  }> {
    const event = await this.eventRepo.findById(eventId)
    if (!event) {
      throw new Error('Acara tidak ditemukan')
    }

    return { id: event.id, slug: event.slug, title: event.title }
  }

  async createTicketType(
    eventId: number,
    currentUser: CurrentUser,
    input: {
      name: string
      description?: string | null
      categoryId?: number
      price?: number
      capacity?: number | null
      minQty?: number
      maxQty?: number
      multipleOf?: number
      isActive?: boolean
    },
  ): Promise<TicketType> {
    const event = await this.eventRepo.findById(eventId)
    if (!event) {
      throw new Error('Acara tidak ditemukan')
    }

    this.assertCanManage(event.created_by, currentUser)

    const name = input.name.trim()

    if (!name) {
      throw new Error('Nama tiket wajib diisi.')
    }

    const minQty = input.minQty ?? 1
    const maxQty = input.maxQty ?? input.capacity ?? DEFAULT_MAX_QTY
    const multipleOf = input.multipleOf ?? 1
    const capacity = input.capacity ?? null
    const price = input.price ?? 0

    this.assertValidQuantity({ minQty, maxQty, multipleOf, capacity, price })

    const existing = await this.ticketTypeRepo.findByEventId(event.id)

    const payload: CreateTicketTypeInput = {
      event_id: event.id,
      name,
      description: input.description?.trim() || null,
      category_id: input.categoryId ?? 1,
      price,
      capacity,
      min_qty: minQty,
      max_qty: maxQty,
      multiple_of: multipleOf,
      is_active: input.isActive ?? true,
      sort_order: existing.length,
    }

    this.logger.info('Creating ticket type', {
      eventId: event.id,
      name: payload.name,
      userId: currentUser.id,
    })

    return this.ticketTypeRepo.create(payload)
  }

  async updateTicketType(
    eventId: number,
    ticketTypeId: number,
    currentUser: CurrentUser,
    input: {
      name?: string
      description?: string | null
      categoryId?: number
      price?: number
      capacity?: number | null
      minQty?: number
      maxQty?: number
      multipleOf?: number
      isActive?: boolean
    },
  ): Promise<TicketType> {
    const event = await this.eventRepo.findById(eventId)
    if (!event) {
      throw new Error('Acara tidak ditemukan')
    }

    this.assertCanManage(event.created_by, currentUser)

    const ticketType = await this.ticketTypeRepo.findById(ticketTypeId)
    if (!ticketType || ticketType.event_id !== event.id) {
      throw new Error('Tipe tiket tidak ditemukan pada acara ini')
    }

    const name = input.name?.trim() ?? ticketType.name

    if (!name) {
      throw new Error('Nama tiket wajib diisi.')
    }

    const minQty = input.minQty ?? ticketType.min_qty
    const maxQty = input.maxQty ?? ticketType.max_qty
    const multipleOf = input.multipleOf ?? ticketType.multiple_of
    const capacity =
      input.capacity === undefined ? ticketType.capacity : input.capacity
    const price = input.price ?? ticketType.price

    this.assertValidQuantity({ minQty, maxQty, multipleOf, capacity, price })

    const payload: UpdateTicketTypeInput = {
      name,
      description:
        input.description === undefined
          ? ticketType.description
          : input.description?.trim() || null,
      category_id: input.categoryId ?? ticketType.category_id,
      price,
      capacity,
      min_qty: minQty,
      max_qty: maxQty,
      multiple_of: multipleOf,
      is_active: input.isActive ?? ticketType.is_active,
    }

    this.logger.info('Updating ticket type', {
      eventId: event.id,
      ticketTypeId,
      userId: currentUser.id,
    })

    return this.ticketTypeRepo.update(ticketTypeId, payload)
  }

  async deleteTicketType(
    eventId: number,
    ticketTypeId: number,
    currentUser: CurrentUser,
  ): Promise<DeleteTicketTypeResult> {
    const event = await this.eventRepo.findById(eventId)
    if (!event) {
      throw new Error('Acara tidak ditemukan')
    }

    this.assertCanManage(event.created_by, currentUser)

    const ticketType = await this.ticketTypeRepo.findById(ticketTypeId)
    if (!ticketType || ticketType.event_id !== event.id) {
      throw new Error('Tipe tiket tidak ditemukan pada acara ini')
    }

    const sold = await this.ticketTypeRepo.hasOrders(ticketTypeId)

    if (sold) {
      this.logger.info('Deactivating sold ticket type', {
        eventId: event.id,
        ticketTypeId,
        userId: currentUser.id,
      })

      const updated = await this.ticketTypeRepo.update(ticketTypeId, {
        is_active: false,
      })

      return { deleted: false, deactivated: true, ticketType: updated }
    }

    this.logger.info('Deleting ticket type', {
      eventId: event.id,
      ticketTypeId,
      userId: currentUser.id,
    })

    try {
      await this.ticketTypeRepo.delete(ticketTypeId)

      return { deleted: true, deactivated: false, ticketType }
    } catch (err: unknown) {
      if (!isForeignKeyViolation(err)) {
        throw err
      }

      this.logger.info('Ticket type is referenced by orders, deactivating', {
        eventId: event.id,
        ticketTypeId,
        userId: currentUser.id,
      })

      const updated = await this.ticketTypeRepo.update(ticketTypeId, {
        is_active: false,
      })

      return { deleted: false, deactivated: true, ticketType: updated }
    }
  }

  private assertValidQuantity(input: {
    minQty: number
    maxQty: number
    multipleOf: number
    capacity: number | null
    price: number
  }): void {
    if (input.minQty < 1) {
      throw new Error('Jumlah minimum harus minimal 1.')
    }

    if (input.maxQty < input.minQty) {
      throw new Error(
        'Jumlah maksimum harus lebih besar atau sama dengan minimum.',
      )
    }

    if (input.multipleOf < 1) {
      throw new Error('Kelipatan harus minimal 1.')
    }

    if (input.capacity !== null && input.capacity < 1) {
      throw new Error('Kapasitas harus lebih besar dari 0.')
    }

    if (input.capacity !== null && input.maxQty > input.capacity) {
      throw new Error('Jumlah maksimum tidak boleh melebihi kapasitas.')
    }

    if (input.price < 0) {
      throw new Error('Harga tidak boleh negatif.')
    }
  }

  private assertCanManage(createdBy: string, currentUser: CurrentUser): void {
    const isAdmin =
      currentUser.role === 'admin' || currentUser.role === 'super_admin'

    if (isAdmin || createdBy === currentUser.id) {
      return
    }

    throw new Error('Anda tidak memiliki izin untuk mengelola tiket acara ini.')
  }
}
