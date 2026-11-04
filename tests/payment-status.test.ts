import { describe, expect, it } from 'vitest'
import {
  mapMidtransStatusToOrder,
  resolveMidtransTransition,
} from '../server/services/payment-status.service'

describe('mapMidtransStatusToOrder', () => {
  it('maps settlement to paid/settled', () => {
    expect(mapMidtransStatusToOrder('settlement')).toEqual({
      orderStatus: 'paid',
      paymentStatus: 'settled',
    })
  })

  it('maps capture with accepted fraud check to paid/paid', () => {
    expect(mapMidtransStatusToOrder('capture', 'accept')).toEqual({
      orderStatus: 'paid',
      paymentStatus: 'paid',
    })
  })

  it('maps capture under fraud challenge to pending', () => {
    expect(mapMidtransStatusToOrder('capture', 'challenge')).toEqual({
      orderStatus: 'pending',
      paymentStatus: 'awaiting_payment',
    })
  })

  it('maps capture with non-accept fraud status to failed', () => {
    expect(mapMidtransStatusToOrder('capture', 'deny')).toEqual({
      orderStatus: 'failed',
      paymentStatus: 'failed',
    })
  })

  it('returns null for unknown statuses', () => {
    expect(mapMidtransStatusToOrder('200')).toBeNull()
    expect(mapMidtransStatusToOrder('something_else')).toBeNull()
  })
})

const pendingOrder = { payment_status: 'awaiting_payment' as const }

describe('resolveMidtransTransition', () => {
  it('applies settlement to a pending order', () => {
    expect(resolveMidtransTransition(pendingOrder, 'settlement')).toEqual({
      action: 'apply',
      orderStatus: 'paid',
      paymentStatus: 'settled',
    })
  })

  it('never downgrades a settled order from a late expire/deny/cancel', () => {
    const settled = { payment_status: 'settled' as const }
    for (const status of ['expire', 'deny', 'cancel', 'pending']) {
      expect(resolveMidtransTransition(settled, status)).toEqual({
        action: 'already_final',
      })
    }
  })

  it('treats a replayed settlement as already final', () => {
    expect(resolveMidtransTransition(settledOrder, 'settlement')).toEqual({
      action: 'already_final',
    })
  })

  it('allows refunds only from paid states', () => {
    expect(resolveMidtransTransition(settledOrder, 'refund')).toEqual({
      action: 'apply',
      orderStatus: 'refunded',
      paymentStatus: 'refunded',
    })
    expect(resolveMidtransTransition(pendingOrder, 'refund')).toEqual({
      action: 'already_final',
    })
  })

  it('marks unknown statuses', () => {
    expect(resolveMidtransTransition(pendingOrder, 'bogus')).toEqual({
      action: 'unknown',
    })
  })
})

const settledOrder = { payment_status: 'settled' as const }
