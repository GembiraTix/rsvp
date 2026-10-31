import type {
  IOrderRepository,
  ITicketRepository,
  IUserRepository,
} from '#server/repositories/interfaces'
import type {
  Order,
  OrderItem,
  CreateOrderInput,
  UserProfile,
} from '#server/domain/types'
import type { ILogger } from './logger.service'
import { nanoid } from 'nanoid'
// @ts-expect-error - midtrans-client has no type declarations
import midtrans from 'midtrans-client'
import { z } from 'zod'
import { PostgrestError } from '@supabase/supabase-js'

const ORDER_EXPIRY_MINUTES = 30

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
    private readonly userRepo: IUserRepository,
    private readonly midtransConfig: MidtransConfig,
    private readonly logger: ILogger,
  ) {}

  async findOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.orderRepo.findOrderItemsByOrderId(orderId)
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.userRepo.findById(userId)
  }

  async createOrder(input: CreateOrderInput): Promise<{
    order: Order
    orderItems: OrderItem[]
    snapToken: string
    redirectUrl: string
  }> {
    const { eventId, userId, lines } = input

    const subtotal = lines.reduce(
      (acc, line) => acc + line.unitPrice * line.qty,
      0,
    )
    const adminFee = 0
    const total = subtotal + adminFee

    const orderNumber = `INV-${nanoid(8)}`
    const token = nanoid(16)
    const expiresAt = new Date(
      Date.now() + ORDER_EXPIRY_MINUTES * 60 * 1000,
    ).toISOString()

    const orderId = crypto.randomUUID()

    const { snapToken, redirectUrl } = await this.createMidtransTransaction(
      orderId,
      lines,
    )

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
      items: lines.map((line) => ({
        ticket_type_id: line.ticketTypeId,
        qty: line.qty,
        unit_price: line.unitPrice,
        total: line.unitPrice * line.qty,
        attendee_data: {},
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
    orderId: string,
    lines: CreateOrderInput['lines'],
  ): Promise<MidtransSnapResponse> {
    const grossAmount = lines.reduce(
      (acc, line) => acc + line.unitPrice * line.qty,
      0,
    )

    const snap = new midtrans.Snap({
      isProduction: this.midtransConfig.isProduction,
      serverKey: this.midtransConfig.serverKey,
    })

    const finishUrl = `${this.midtransConfig.appUrl}/api/checkout/finish`

    const params = {
      transaction_details: {
        order_id: `ORDER-${orderId}`,
        gross_amount: grossAmount,
      },
      item_details: lines.map((line) => ({
        id: String(line.ticketTypeId),
        name: line.name,
        price: line.unitPrice,
        quantity: line.qty,
      })),
      callbacks: {
        finish: finishUrl,
        unfinish: finishUrl,
        error: finishUrl,
      },
    }

    this.logger.info('params: ', params)

    const response = await snap.createTransaction(params)

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

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.findByUser(userId)
  }
}
