import type {
  IEventRepository,
  ITicketTypeRepository,
} from '#server/repositories/interfaces'
import type {
  TicketType,
  TicketTypeKind,
  UserRole,
  CreateTicketTypeInput,
} from '#server/domain/types'
import type { ILogger } from './logger.service'

const DEFAULT_MULTIPLE_OF: Record<TicketTypeKind, number> = {
  single: 1,
  couple: 2,
  berempat: 4,
}

const DEFAULT_MAX_QTY = 10

export interface CurrentUser {
  id: string
  role?: UserRole | null
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

  async createTicketType(
    slug: string,
    currentUser: CurrentUser,
    input: {
      name: string
      description?: string | null
      kind: TicketTypeKind
      price: number
      capacity?: number | null
      minQty?: number
      maxQty?: number
      multipleOf?: number
      isActive: boolean
    },
  ): Promise<TicketType> {
    const event = await this.eventRepo.findBySlug(slug)
    if (!event) {
      throw new Error('Acara tidak ditemukan')
    }

    this.assertCanManage(event.created_by, currentUser)

    const kind = input.kind
    const name = input.name.trim()

    if (!name) {
      throw new Error('Nama tiket wajib diisi.')
    }

    const minQty = input.minQty ?? 1
    const maxQty = input.maxQty ?? input.capacity ?? DEFAULT_MAX_QTY
    const multipleOf = input.multipleOf ?? DEFAULT_MULTIPLE_OF[kind]
    const capacity = input.capacity ?? null
    const price = input.price ?? 0

    if (minQty < 1) {
      throw new Error('Jumlah minimum harus minimal 1.')
    }

    if (maxQty < minQty) {
      throw new Error(
        'Jumlah maksimum harus lebih besar atau sama dengan minimum.',
      )
    }

    if (multipleOf < 1) {
      throw new Error('Kelipatan harus minimal 1.')
    }

    if (capacity !== null && capacity < 1) {
      throw new Error('Kapasitas harus lebih besar dari 0.')
    }

    if (capacity !== null && maxQty > capacity) {
      throw new Error('Jumlah maksimum tidak boleh melebihi kapasitas.')
    }

    if (price < 0) {
      throw new Error('Harga tidak boleh negatif.')
    }

    const existing = await this.ticketTypeRepo.findByEventId(event.id)

    const payload: CreateTicketTypeInput = {
      event_id: event.id,
      name,
      description: input.description?.trim() || null,
      kind,
      price,
      capacity,
      min_qty: minQty,
      max_qty: maxQty,
      multiple_of: multipleOf,
      is_active: input.isActive,
      sort_order: existing.length,
    }

    this.logger.info('Creating ticket type', {
      eventId: event.id,
      name: payload.name,
      userId: currentUser.id,
    })

    return this.ticketTypeRepo.create(payload)
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
