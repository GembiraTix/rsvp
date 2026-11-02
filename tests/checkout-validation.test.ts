import { describe, expect, it } from 'vitest'
import {
  CheckoutValidationError,
  resolveCheckoutLines,
} from '../server/services/checkout-validation'
import type { TicketType } from '../server/domain/types'

function makeTicketType(overrides: Partial<TicketType> = {}): TicketType {
  return {
    id: 1,
    event_id: 1,
    name: 'Reguler',
    description: null,
    kind: 'single',
    price: 50000,
    capacity: null,
    min_qty: 1,
    max_qty: 10,
    multiple_of: 1,
    sort_order: 0,
    is_active: true,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

const types = [makeTicketType({ id: 1 }), makeTicketType({ id: 2, price: 90000 })]

describe('resolveCheckoutLines', () => {
  it('resolves lines with server-side prices and names', () => {
    expect(
      resolveCheckoutLines(types, [
        { ticketTypeId: 1, qty: 2 },
        { ticketTypeId: 2, qty: 1 },
      ]),
    ).toEqual([
      { ticketTypeId: 1, name: 'Reguler', unitPrice: 50000, qty: 2 },
      {
        ticketTypeId: 2,
        name: 'Reguler',
        unitPrice: 90000,
        qty: 1,
      },
    ])
  })

  it('rejects unknown ticket type ids', () => {
    expect(() => resolveCheckoutLines(types, [{ ticketTypeId: 99, qty: 1 }]))
      .toThrow(CheckoutValidationError)
  })

  it('rejects inactive ticket types', () => {
    const inactive = [makeTicketType({ id: 3, is_active: false })]
    expect(() => resolveCheckoutLines(inactive, [{ ticketTypeId: 3, qty: 1 }]))
      .toThrow(CheckoutValidationError)
  })

  it('rejects qtys outside the valid grid', () => {
    const constrained = [
      makeTicketType({ id: 1, min_qty: 2, max_qty: 6, multiple_of: 2 }),
    ]
    expect(() =>
      resolveCheckoutLines(constrained, [{ ticketTypeId: 1, qty: 1 }]),
    ).toThrow(CheckoutValidationError)
    expect(() =>
      resolveCheckoutLines(constrained, [{ ticketTypeId: 1, qty: 3 }]),
    ).toThrow(CheckoutValidationError)
    expect(() =>
      resolveCheckoutLines(constrained, [{ ticketTypeId: 1, qty: 8 }]),
    ).toThrow(CheckoutValidationError)
  })

  it('rejects duplicate ticket type ids', () => {
    expect(() =>
      resolveCheckoutLines(types, [
        { ticketTypeId: 1, qty: 1 },
        { ticketTypeId: 1, qty: 2 },
      ]),
    ).toThrow(CheckoutValidationError)
  })

  it('rejects negative prices', () => {
    const badPrice = [makeTicketType({ id: 1, price: -1 })]
    expect(() => resolveCheckoutLines(badPrice, [{ ticketTypeId: 1, qty: 1 }]))
      .toThrow(CheckoutValidationError)
  })
})
