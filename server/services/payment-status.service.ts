import type {
  IOrderRepository,
  IPaymentEventRepository,
} from '../repositories/interfaces'
import type { Order, OrderStatus, PaymentStatus } from '../domain/types'
import type { ILogger } from './logger.service'
import type { OrderService } from './order.service'
import type { TicketService } from './ticket.service'

const FINAL_PAYMENT_STATUSES: PaymentStatus[] = [
  'settled',
  'paid',
  'refunded',
  'partial_refund',
]

const REFUND_PAYMENT_STATUSES: PaymentStatus[] = ['refunded', 'partial_refund']

export function mapMidtransStatusToOrder(
  transactionStatus: string,
  fraudStatus?: string | null,
): { orderStatus: OrderStatus; paymentStatus: PaymentStatus } | null {
  switch (transactionStatus) {
    case 'settlement':
      return { orderStatus: 'paid', paymentStatus: 'settled' }
    case 'capture':
      if (fraudStatus === 'challenge') {
        return { orderStatus: 'pending', paymentStatus: 'awaiting_payment' }
      }
      if (fraudStatus && fraudStatus !== 'accept') {
        return { orderStatus: 'failed', paymentStatus: 'failed' }
      }
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
      return null
  }
}

export type MidtransTransition =
  | { action: 'apply'; orderStatus: OrderStatus; paymentStatus: PaymentStatus }
  | { action: 'already_final' }
  | { action: 'unknown' }

export function resolveMidtransTransition(
  order: Pick<Order, 'payment_status'>,
  transactionStatus: string,
  fraudStatus?: string | null,
): MidtransTransition {
  const mapped = mapMidtransStatusToOrder(transactionStatus, fraudStatus)

  if (!mapped) {
    return { action: 'unknown' }
  }

  const isRefund = REFUND_PAYMENT_STATUSES.includes(mapped.paymentStatus)

  if (isRefund) {
    // refunds only make sense from a paid state
    if (!['settled', 'paid'].includes(order.payment_status)) {
      return { action: 'already_final' }
    }
    return { action: 'apply', ...mapped }
  }

  // never move a finalized order backwards (late expire/deny, replayed notifications)
  if (FINAL_PAYMENT_STATUSES.includes(order.payment_status)) {
    return { action: 'already_final' }
  }

  return { action: 'apply', ...mapped }
}

export type ApplyMidtransUpdateInput = {
  order: Order
  transactionStatus: string
  fraudStatus?: string | null
  grossAmount?: string | null
  transactionId?: string | null
  paymentType?: string | null
  source: 'notification' | 'status_api'
  raw: Record<string, unknown>
  signatureValid?: boolean
}

export type ApplyMidtransUpdateResult =
  | 'applied'
  | 'duplicate'
  | 'already_final'
  | 'gross_amount_mismatch'
  | 'unknown_status'
  | 'not_applied'

export class PaymentStatusService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly paymentEventRepo: IPaymentEventRepository,
    private readonly orderService: OrderService,
    private readonly ticketService: TicketService,
    private readonly logger: ILogger,
  ) {}

  async findByMidtransOrderId(midtransOrderId: string): Promise<Order | null> {
    return this.orderRepo.findByMidtransOrderId(midtransOrderId)
  }

  async applyMidtransUpdate(
    input: ApplyMidtransUpdateInput,
  ): Promise<ApplyMidtransUpdateResult> {
    const { order } = input

    if (
      input.transactionId &&
      (await this.paymentEventRepo.existsByTransactionAndStatus(
        input.transactionId,
        input.transactionStatus,
      ))
    ) {
      this.logger.info('Duplicate payment notification ignored', {
        orderId: order.id,
        transactionId: input.transactionId,
        transactionStatus: input.transactionStatus,
      })
      return 'duplicate'
    }

    const eventId = await this.paymentEventRepo.create({
      order_id: order.id,
      midtrans_order_id: order.midtrans_order_id,
      midtrans_transaction_id: input.transactionId ?? null,
      event_type: input.transactionStatus,
      payload: { source: input.source, ...input.raw },
      signature_valid: input.signatureValid ?? null,
    })

    const reject = async (error: string) => {
      this.logger.warn('Payment notification rejected', {
        orderId: order.id,
        transactionStatus: input.transactionStatus,
        error,
      })
      await this.paymentEventRepo.markProcessed(eventId, error)
    }

    if (
      input.grossAmount != null &&
      order.total != null &&
      Number(input.grossAmount) !== order.total
    ) {
      await reject(
        `gross_amount_mismatch: notification ${input.grossAmount}, order total ${order.total}`,
      )
      return 'gross_amount_mismatch'
    }

    const transition = resolveMidtransTransition(
      order,
      input.transactionStatus,
      input.fraudStatus,
    )

    if (transition.action === 'unknown') {
      await reject(`unknown transaction_status: ${input.transactionStatus}`)
      return 'unknown_status'
    }

    if (transition.action === 'already_final') {
      await this.paymentEventRepo.markProcessed(eventId)
      // the order may have settled via another path (e.g. webhook raced
      // the finish endpoint) while ticket issuance failed; retry safely
      await this.issueTicketsIfNeeded(order)
      return 'already_final'
    }

    const isSettled =
      transition.paymentStatus === 'settled' ||
      transition.paymentStatus === 'paid'
    const isRefund = REFUND_PAYMENT_STATUSES.includes(transition.paymentStatus)

    const updated = await this.orderRepo.updateStatus(
      order.id,
      {
        status: transition.orderStatus,
        payment_status: transition.paymentStatus,
        ...(isSettled ? { paid_at: new Date().toISOString() } : {}),
        ...(input.transactionId
          ? { midtrans_transaction_id: input.transactionId }
          : {}),
      },
      isRefund
        ? { onlyIfPaymentStatusIn: ['settled', 'paid'] }
        : { unlessPaymentStatusIn: FINAL_PAYMENT_STATUSES },
    )

    if (!updated) {
      await this.paymentEventRepo.markProcessed(
        eventId,
        'order status changed concurrently',
      )
      return 'not_applied'
    }

    this.logger.info('Order payment status updated', {
      orderId: order.id,
      status: transition.orderStatus,
      paymentStatus: transition.paymentStatus,
      source: input.source,
    })

    if (isSettled) {
      await this.issueTicketsIfNeeded(order)
    }

    await this.paymentEventRepo.markProcessed(eventId)
    return 'applied'
  }

  private async issueTicketsIfNeeded(order: Order): Promise<void> {
    const existingTickets = await this.ticketService.findTicketsByOrderId(
      order.id,
    )
    if (existingTickets.length > 0) {
      return
    }

    const orderItems = await this.orderService.findOrderItemsByOrderId(order.id)
    const userProfile = await this.orderService.getUserProfile(order.user_id)

    if (orderItems.length === 0 || !userProfile) {
      this.logger.error('Cannot issue tickets for settled order', {
        orderId: order.id,
        hasOrderItems: orderItems.length > 0,
        hasUserProfile: Boolean(userProfile),
      })
      return
    }

    await this.ticketService.issueTickets({
      orderId: order.id,
      userId: order.user_id,
      eventId: order.event_id,
      attendeeName: userProfile.name ?? 'Tamu',
      attendeeEmail: userProfile.email ?? '',
      attendeeEmailPhone: null,
      items: orderItems.map((item) => ({
        ticket_type_id: item.ticket_type_id,
        qty: item.qty,
      })),
    })

    this.logger.info('Tickets issued for settled order', {
      orderId: order.id,
      lineItems: orderItems.length,
    })
  }
}
