import type {
  IOrderRepository,
  ITicketRepository,
  IRsvpRepository,
  IEventRepository,
} from '#server/repositories/interfaces'
import type {
  Order,
  OrderItem,
  OrderWithEvent,
  CreateOrderInput,
} from '#server/domain/types'
import type { ILogger } from './logger.service'
import { nanoid } from 'nanoid'
// @ts-expect-error - midtrans-client has no type declarations
import midtrans from 'midtrans-client'
import { z } from 'zod'
import { PostgrestError } from '@supabase/supabase-js'
import { CheckoutValidationError } from './checkout-validation'
import type { PaymentSettingsService } from './payment-settings.service'
import { isValidWhatsapp } from '../../shared/utils/whatsapp'

const ORDER_EXPIRY_MINUTES = 30

export class OrderNotPayableError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
  }
}

interface SnapTransactionParams {
  midtransOrderId: string
  grossAmount: number
  itemDetails: {
    id: string
    name: string
    price: number
    quantity: number
  }[]
}

export interface MidtransConfig {
  serverKey: string
  clientKey: string
  isProduction: boolean
  appUrl: string
}

export interface MidtransSnapResponse {
  snapToken: string
  redirectUrl: string
}

export class OrderService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly ticketRepo: ITicketRepository,
    private readonly rsvpRepo: IRsvpRepository,
    private readonly eventRepo: IEventRepository,
    private readonly paymentSettingsService: PaymentSettingsService,
    private readonly midtransConfig: MidtransConfig,
    private readonly logger: ILogger,
  ) {}

  async findOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.orderRepo.findOrderItemsByOrderId(orderId)
  }

  async createOrder(input: CreateOrderInput): Promise<{
    order: Order
    orderItems: OrderItem[]
    snapToken: string
    redirectUrl: string
  }> {
    const { eventId, userId, lines } = input

    for (const line of lines) {
      if (line.attendees.length !== line.qty) {
        throw new CheckoutValidationError(
          'Jumlah data peserta tidak sesuai dengan jumlah tiket.',
        )
      }
    }

    const attendees = lines.flatMap((line) => line.attendees)
    const seenEmails = new Set<string>()
    for (const attendee of attendees) {
      const email = attendee.email.trim().toLowerCase()
      if (seenEmails.has(email)) {
        throw new CheckoutValidationError(
          'Email peserta tidak boleh duplikat dalam satu pesanan.',
        )
      }
      seenEmails.add(email)
    }

    const registeredEmails = await this.rsvpRepo.findRegisteredEmails(
      eventId,
      attendees.map((a) => a.email),
    )
    if (registeredEmails.length > 0) {
      throw new CheckoutValidationError(
        'Beberapa peserta sudah terdaftar untuk acara ini. Periksa kembali email peserta.',
        409,
      )
    }

    const event = await this.eventRepo.findById(eventId)
    if (!event) {
      throw new CheckoutValidationError('Acara tidak ditemukan.', 404)
    }

    if (event.registration_limit) {
      const [attendingCount, pendingTicketCount] = await Promise.all([
        this.rsvpRepo.countAttendingByEventId(eventId),
        this.ticketRepo.countPendingOrderTicketsByEventId(eventId),
      ])
      if (
        attendingCount + pendingTicketCount + attendees.length >
        event.registration_limit
      ) {
        throw new CheckoutValidationError('Kuota penuh.', 409)
      }
    }

    const normalizedLines = lines.map((line) => ({
      ...line,
      attendees: line.attendees.map((attendee) => ({
        ...attendee,
        name: attendee.name.trim(),
        identityNumber: attendee.identityNumber.trim(),
        email: attendee.email.trim().toLowerCase(),
        whatsapp: attendee.whatsapp.trim(),
      })),
    }))

    for (const attendee of normalizedLines.flatMap((l) => l.attendees)) {
      if (!isValidWhatsapp(attendee.whatsapp)) {
        throw new CheckoutValidationError('Nomor WhatsApp tidak valid.')
      }
    }

    const subtotal = normalizedLines.reduce(
      (acc, line) => acc + line.unitPrice * line.qty,
      0,
    )
    const { fee: adminFee } =
      await this.paymentSettingsService.resolveAdminFee(eventId)
    const total = subtotal + adminFee

    const orderNumber = `INV-${nanoid(8)}`
    const token = nanoid(16)
    const expiresAt = new Date(
      Date.now() + ORDER_EXPIRY_MINUTES * 60 * 1000,
    ).toISOString()

    const orderId = crypto.randomUUID()
    const itemDetails = normalizedLines.map((line) => ({
      id: String(line.ticketTypeId),
      name: line.name,
      price: line.unitPrice,
      quantity: line.qty,
    }))

    if (adminFee > 0) {
      itemDetails.push({
        id: 'admin-fee',
        name: 'Biaya layanan',
        price: adminFee,
        quantity: 1,
      })
    }

    const { snapToken, redirectUrl } = await this.createMidtransTransaction({
      midtransOrderId: `ORDER-${orderId}`,
      grossAmount: total,
      itemDetails: itemDetails,
    })

    const order = await this.orderRepo.create({
      id: orderId,
      order_number: orderNumber,
      event_id: eventId,
      user_id: userId,
      subtotal,
      admin_fee: adminFee,
      total,
      expires_at: expiresAt,
      token,
      midtrans_order_id: `ORDER-${orderId}`,
      checkout_url: redirectUrl,
      status: 'pending',
      payment_status: 'awaiting_payment',
    })

    this.logger.info('Order created', {
      orderId: order.id,
      orderNumber,
      userId,
      eventId,
      total,
    })

    const orderItems = await this.ticketRepo.createOrderItems({
      order_id: order.id,
      items: normalizedLines.map((line) => ({
        ticket_type_id: line.ticketTypeId,
        qty: line.qty,
        unit_price: line.unitPrice,
        total: line.unitPrice * line.qty,
      })),
    })

    await this.ticketRepo.createTickets({
      order_id: order.id,
      user_id: userId,
      items: normalizedLines.map((line) => ({
        ticket_type_id: line.ticketTypeId,
        attendees: line.attendees.map((attendee) => ({
          name: attendee.name,
          email: attendee.email,
          phone: null,
          identity_type: attendee.identityType,
          identity_number: attendee.identityNumber,
          whatsapp: attendee.whatsapp,
          gender: attendee.gender,
        })),
      })),
    })

    return {
      order,
      orderItems,
      snapToken,
      redirectUrl,
    }
  }

  private async createMidtransTransaction(
    params: SnapTransactionParams,
  ): Promise<MidtransSnapResponse> {
    const snap = new midtrans.Snap({
      isProduction: this.midtransConfig.isProduction,
      serverKey: this.midtransConfig.serverKey,
    })

    const finishUrl = `${this.midtransConfig.appUrl}/api/checkout/finish`

    const transactionParams = {
      transaction_details: {
        order_id: params.midtransOrderId,
        gross_amount: params.grossAmount,
      },
      item_details: params.itemDetails,
      callbacks: {
        finish: finishUrl,
        unfinish: finishUrl,
        error: finishUrl,
      },
    }

    this.logger.info('params: ', transactionParams)

    const response = await snap.createTransaction(transactionParams)

    const responseSchema = z
      .object({
        token: z.string(),
        redirect_url: z.url(),
      })
      .required()
    const { data, error } = responseSchema.safeParse(response)

    if (error) {
      console.error(response)
      throw new Error('response is unexpected')
    }

    return {
      snapToken: data.token,
      redirectUrl: data.redirect_url,
    }
  }

  async findByMidtransOrderId(midtransOrderId: string): Promise<Order | null> {
    try {
      const order = await this.orderRepo.findByMidtransOrderId(midtransOrderId)
      return order
    } catch (e) {
      if (e instanceof PostgrestError) {
        if (e.code === 'PGRST116') {
          console.error(
            `order with midtrans_order_id ${midtransOrderId} doesn't exist`,
          )
          return null
        }
      }
    }

    return null
  }

  async findById(id: string): Promise<Order | null> {
    return this.orderRepo.findById(id)
  }

  async findByUser(userId: string): Promise<OrderWithEvent[]> {
    return this.orderRepo.findByUser(userId)
  }

  async resumeCheckout(order: Order): Promise<MidtransSnapResponse> {
    if (order.status !== 'pending') {
      throw new OrderNotPayableError('Pesanan tidak dapat dibayar.', 409)
    }

    if (new Date(order.expires_at).getTime() <= Date.now()) {
      await this.orderRepo.updateStatus(
        order.id,
        { status: 'expired', payment_status: 'expired' },
        { onlyIfPaymentStatusIn: ['pending', 'awaiting_payment'] },
      )
      await this.ticketRepo.deleteByOrderId(order.id)
      throw new OrderNotPayableError('Pesanan telah kedaluwarsa.', 410)
    }

    const grossAmount = order.total ?? order.subtotal + order.admin_fee
    const { redirectUrl } = await this.createMidtransTransaction({
      midtransOrderId: order.midtrans_order_id ?? `ORDER-${order.id}`,
      grossAmount,
      itemDetails: [
        {
          id: order.order_number,
          name: order.order_number,
          price: grossAmount,
          quantity: 1,
        },
      ],
    })

    await this.orderRepo.updateCheckoutUrl(order.id, redirectUrl)

    return { snapToken: '', redirectUrl }
  }
}
