import { describe, expect, it, vi } from 'vitest'
import { OrderNotPayableError, OrderService } from '../server/services/order.service'
import type { Order } from '../server/domain/types'

const createTransactionMock = vi.hoisted(() => vi.fn())

vi.mock('midtrans-client', () => ({
  default: {
    Snap: class {
      createTransaction = createTransactionMock
    },
  },
}))

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

function buildService() {
  const orderRepo = {
    updateStatus: vi.fn().mockResolvedValue(true),
    updateCheckoutUrl: vi.fn().mockResolvedValue(undefined),
  }
  const service = new OrderService(
    orderRepo as never,
    {} as never,
    {} as never,
    {
      serverKey: 'server-key',
      clientKey: 'client-key',
      isProduction: false,
      appUrl: 'https://app.test',
    },
    logger as never,
  )
  return { service, orderRepo }
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    order_number: 'INV-ABC12345',
    event_id: 1,
    user_id: 'user-1',
    subtotal: 100000,
    admin_fee: 0,
    total: 100000,
    status: 'pending',
    payment_status: 'awaiting_payment',
    midtrans_order_id: 'ORDER-order-1',
    midtrans_transaction_id: null,
    token: 'token',
    checkout_url: 'https://snap.old',
    paid_at: null,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('resumeCheckout', () => {
  it('creates a new Snap transaction with the same midtrans order id and persists the new checkout url', async () => {
    createTransactionMock.mockResolvedValue({
      token: 'snap-token',
      redirect_url: 'https://snap.new',
    })
    const { service, orderRepo } = buildService()

    const result = await service.resumeCheckout(makeOrder())

    expect(result.redirectUrl).toBe('https://snap.new')
    const params = createTransactionMock.mock.calls[0][0]
    expect(params.transaction_details.order_id).toBe('ORDER-order-1')
    expect(params.transaction_details.gross_amount).toBe(100000)
    expect(orderRepo.updateCheckoutUrl).toHaveBeenCalledWith(
      'order-1',
      'https://snap.new',
    )
  })

  it('falls back to subtotal + admin fee when total is null', async () => {
    createTransactionMock.mockResolvedValue({
      token: 'snap-token',
      redirect_url: 'https://snap.new',
    })
    const { service } = buildService()

    await service.resumeCheckout(makeOrder({ total: null, admin_fee: 5000 }))

    expect(createTransactionMock.mock.calls[0][0].transaction_details.gross_amount).toBe(
      105000,
    )
  })

  it('expires an overdue pending order and throws 410', async () => {
    const { service, orderRepo } = buildService()
    const order = makeOrder({
      expires_at: new Date(Date.now() - 60 * 1000).toISOString(),
    })

    await expect(service.resumeCheckout(order)).rejects.toMatchObject({
      statusCode: 410,
    })
    expect(orderRepo.updateStatus).toHaveBeenCalledWith(
      'order-1',
      { status: 'expired', payment_status: 'expired' },
      { onlyIfPaymentStatusIn: ['pending', 'awaiting_payment'] },
    )
    expect(createTransactionMock).not.toHaveBeenCalled()
  })

  it('rejects non-pending orders without contacting Midtrans', async () => {
    const { service } = buildService()

    await expect(
      service.resumeCheckout(makeOrder({ status: 'paid' })),
    ).rejects.toBeInstanceOf(OrderNotPayableError)
    expect(createTransactionMock).not.toHaveBeenCalled()
  })
})
