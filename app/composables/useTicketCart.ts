import type { TicketType } from '~~/server/domain/types'
import { computed } from 'vue'

export interface CartLine {
  ticketType: TicketType
  qty: number
  total: number
}

export interface TicketCart {
  isSelected: (ticketType: TicketType) => boolean
  qtyOf: (ticketType: TicketType) => number
  select: (ticketType: TicketType) => void
  increment: (ticketType: TicketType) => void
  decrement: (ticketType: TicketType) => void
  remove: (ticketType: TicketType) => void
  canIncrement: (ticketType: TicketType) => boolean
  selectedLines: ComputedRef<CartLine[]>
  subtotal: ComputedRef<number>
  totalQty: ComputedRef<number>
}

export function firstValidQty(ticketType: TicketType): number | null {
  const { min_qty, max_qty, multiple_of } = ticketType
  let qty = min_qty
  while (qty % multiple_of !== 0) {
    qty += 1
  }
  if (qty > max_qty) {
    return null
  }
  return qty
}

export function useTicketCart(ticketTypes: MaybeRefOrGetter<TicketType[]>): TicketCart {
  const cart = ref<Record<number, number>>({})

  const list = computed(() => toValue(ticketTypes))

  const isSelected = (ticketType: TicketType) => {
    return (cart.value[ticketType.id] ?? 0) > 0
  }

  const qtyOf = (ticketType: TicketType) => {
    return cart.value[ticketType.id] ?? 0
  }

  const select = (ticketType: TicketType) => {
    const valid = firstValidQty(ticketType)
    if (valid === null) return
    cart.value[ticketType.id] = valid
  }

  const increment = (ticketType: TicketType) => {
    const current = cart.value[ticketType.id] ?? 0
    const next = current + ticketType.multiple_of
    if (next > ticketType.max_qty) return
    cart.value[ticketType.id] = next
  }

  const decrement = (ticketType: TicketType) => {
    const current = cart.value[ticketType.id] ?? 0
    const next = current - ticketType.multiple_of
    if (next < ticketType.min_qty) {
      delete cart.value[ticketType.id]
    } else {
      cart.value[ticketType.id] = next
    }
  }

  const remove = (ticketType: TicketType) => {
    delete cart.value[ticketType.id]
  }

  const canIncrement = (ticketType: TicketType) => {
    const current = cart.value[ticketType.id] ?? 0
    return current + ticketType.multiple_of <= ticketType.max_qty
  }

  const selectedLines = computed<CartLine[]>(() => {
    return list.value
      .filter((t) => isSelected(t))
      .map((t) => {
        const qty = qtyOf(t)
        return {
          ticketType: t,
          qty,
          total: t.price * qty,
        }
      })
  })

  const subtotal = computed(() => {
    return selectedLines.value.reduce((sum, line) => sum + line.total, 0)
  })

  const totalQty = computed(() => {
    return selectedLines.value.reduce((sum, line) => sum + line.qty, 0)
  })

  return {
    isSelected,
    qtyOf,
    select,
    increment,
    decrement,
    remove,
    canIncrement,
    selectedLines,
    subtotal,
    totalQty,
  }
}
