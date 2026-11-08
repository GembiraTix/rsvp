import { describe, expect, it } from 'vitest'
import { clampQty, isValidTicketQty } from '../shared/utils/ticket-qty'
import type { QtyConstraints } from '../shared/utils/ticket-qty'

const base: QtyConstraints = {
  min_qty: 1,
  max_qty: 10,
  multiple_of: 1,
}

describe('clampQty', () => {
  it('keeps valid qtys unchanged', () => {
    const tt = { ...base, min_qty: 2, max_qty: 8, multiple_of: 2 }
    expect(clampQty(tt, 4)).toBe(4)
    expect(clampQty(tt, 2)).toBe(2)
    expect(clampQty(tt, 8)).toBe(8)
  })

  it('snaps non-multiples down onto the grid', () => {
    const tt = { ...base, multiple_of: 2 }
    expect(clampQty(tt, 5)).toBe(4)
  })

  it('snaps below-min qtys up to the smallest valid qty', () => {
    const tt = { ...base, min_qty: 3, multiple_of: 2 }
    expect(clampQty(tt, 1)).toBe(4)
  })

  it('clamps overshoot down to the largest valid qty', () => {
    const tt = { ...base, min_qty: 2, max_qty: 5, multiple_of: 2 }
    expect(clampQty(tt, 6)).toBe(4)
  })

  it('returns 0 for zero and negative qtys', () => {
    expect(clampQty(base, 0)).toBe(0)
    expect(clampQty(base, -2)).toBe(0)
  })

  it('returns 0 when no valid qty exists', () => {
    const tt = { ...base, min_qty: 3, max_qty: 3, multiple_of: 2 }
    expect(clampQty(tt, 2)).toBe(0)
  })
})

describe('isValidTicketQty', () => {
  it('rejects qtys outside min/max or off-grid', () => {
    const tt = { ...base, min_qty: 2, max_qty: 6, multiple_of: 2 }
    expect(isValidTicketQty(tt, 1)).toBe(false)
    expect(isValidTicketQty(tt, 3)).toBe(false)
    expect(isValidTicketQty(tt, 8)).toBe(false)
    expect(isValidTicketQty(tt, 4)).toBe(true)
  })
})
