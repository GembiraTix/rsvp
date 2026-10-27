import type {
  IOrderRepository,
  ITicketRepository,
} from '#server/repositories/interfaces'
import type {
  Order,
  OrderItem,
  CreateOrderInput,
  OrderStatus,
  PaymentStatus,
} from '#server/domain/types'
import type { ILogger } from './logger.service'
import { nanoid } from 'nanoid'
import midtrans from 'midtrans-client'
import { z } from 'zod'

const ORDER_EXPIRY_MINUTES = 30

export interface MidtransConfig {
  serverKey: string
  clientKey: string
  isProduction: boolean
}

export interface MidtransSnapResponse {
  snapToken: string
  redirectUrl: string
}

export class OrderService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly ticketRepo: ITicketRepository,
    private readonly midtransConfig: MidtransConfig,
    private readonly logger: ILogger,
  ) {}

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

    const order = await this.orderRepo.create({
      order_number: orderNumber,
      event_id: eventId,
      user_id: userId,
      subtotal,
      admin_fee: adminFee,
      total,
      expires_at: expiresAt,
      token,
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

    this.logger.info('order items created. creating midtrans transaction...')

    const { snapToken, redirectUrl } = await this.createMidtransTransaction(
      order,
      lines,
    )

    await this.orderRepo.updateMidtrans(order.id, {
      midtrans_order_id: `ORDER-${order.id}`,
      midtrans_transaction_id: null,
      checkout_url: redirectUrl,
    })

    return {
      order: {
        ...order,
        midtrans_order_id: `ORDER-${order.id}`,
        checkout_url: redirectUrl,
      },
      orderItems,
      snapToken,
      redirectUrl,
    }
  }

  private async createMidtransTransaction(
    order: Order,
    lines: { ticketTypeId: number; qty: number; unitPrice: number }[],
  ): Promise<MidtransSnapResponse> {
    const grossAmount = lines.reduce(
      (acc, line) => acc + line.unitPrice * line.qty,
      0,
    )

    const snap = new midtrans.Snap({
      isProduction: this.midtransConfig.isProduction,
      serverKey: this.midtransConfig.serverKey,
    })

    const params = {
      transaction_details: {
        order_id: `ORDER-${order.id}`,
        gross_amount: grossAmount,
      },
      item_details: lines.map((line) => ({
        id: String(line.ticketTypeId),
        name: `Tiket #${line.ticketTypeId}`,
        price: line.unitPrice,
        quantity: line.qty,
      })),
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

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.orderRepo.updateStatus(id, status)
    this.logger.info('Order status updated', { orderId: id, status })
  }

  async findByMidtransOrderId(midtransOrderId: string): Promise<Order | null> {
    return this.orderRepo.findByMidtransOrderId(midtransOrderId)
  }

  async findById(id: string): Promise<Order | null> {
    return this.orderRepo.findById(id)
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.findByUser(userId)
  }
}

export function mapMidtransStatusToOrder(status: string): {
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
} {
  switch (status) {
    case 'settlement':
      return { orderStatus: 'paid', paymentStatus: 'settled' }
    case 'capture':
      return { orderStatus: 'paid', paymentStatus: 'paid' }
    case 'pending':
      return { orderStatus: 'pending', paymentStatus: 'awaiting_payment' }
    case 'deny':
      return { orderStatus: 'failed', paymentStatus: 'failed' }
    case 'expire':
      return { orderStatus: 'expired', paymentStatus: 'expired' }
    case 'cancel':
      return { orderStatus: 'cancelled', paymentStatus: 'cancelled' }
    case 'refund':
      return { orderStatus: 'refunded', paymentStatus: 'refunded' }
    case 'partial_refund':
      return {
        orderStatus: 'partial_refund',
        paymentStatus: 'partial_refund',
      }
    case 'chargeback':
      return { orderStatus: 'failed', paymentStatus: 'failed' }
    default:
      return { orderStatus: 'pending', paymentStatus: 'pending' }
  }
}
