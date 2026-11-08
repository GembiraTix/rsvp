export interface QtyConstraints {
  min_qty: number
  max_qty: number
  multiple_of: number
}

/**
 * Valid qtys are >= min_qty, <= max_qty and a multiple of multiple_of
 * (grid anchored at 0).
 * */
export function isValidTicketQty(
  constraints: QtyConstraints,
  qty: number,
): boolean {
  return (
    qty >= constraints.min_qty &&
    qty <= constraints.max_qty &&
    qty % constraints.multiple_of === 0
  )
}

/**
 * Snaps a qty onto the valid grid; 0 means deselect.
 * Returns 0 when no valid qty exists for the constraints.
 * */
export function clampQty(constraints: QtyConstraints, qty: number): number {
  if (qty <= 0) return 0

  const { min_qty, max_qty, multiple_of } = constraints
  const minValid = Math.ceil(min_qty / multiple_of) * multiple_of
  const maxValid = Math.floor(max_qty / multiple_of) * multiple_of
  if (minValid > maxValid) return 0

  const floored = Math.floor(qty / multiple_of) * multiple_of
  return Math.max(minValid, Math.min(floored, maxValid))
}
