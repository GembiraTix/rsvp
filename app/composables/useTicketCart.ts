import type { TicketType } from '~~/server/domain/types'
import { computed } from 'vue'

export type CartLine = {
  ticketType: TicketType
  qty: number
}

export type SelectedCartLine = {
  ticketType: TicketType
  qty: number
  total: number
}

export interface TicketCart {
  cart: Ref<CartLine[]>
  selectedLines: ComputedRef<SelectedCartLine[]>
  subtotal: ComputedRef<number>
  totalQty: ComputedRef<number>
  select(id: number): void
  remove(id: number): void
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

export function useTicketCart(iticketTypes: Ref<TicketType[]>): TicketCart {
  const ticketTypes = ref<TicketType[]>(toValue(iticketTypes))

  const cart = ref<CartLine[]>(
    ticketTypes.value.map((t) => ({
      ticketType: t,
      qty: 0,
    })),
  )

  const selectedLines = computed(() => {
    return cart.value
      .filter((t) => t.qty > 0)
      .map((t) => {
        return {
          ticketType: t.ticketType,
          qty: t.qty,
          total: t.ticketType.price * t.qty,
        }
      })
  })

  const totalQty = computed(() => {
    return cart.value.reduce((acc, line) => acc + line.qty, 0)
  })

  const subtotal = computed(() => {
    return cart.value.reduce(
      (acc, line) => acc + line.ticketType.price * line.qty,
      0,
    )
  })

  function select(id: number) {
    const ticketType = ticketTypes.value.find((t) => t.id === id)
    if (!ticketType) return

    const nextValidQty = ticketType.multiple_of

    cart.value = cart.value.map((c) => {
      if (c.ticketType.id !== id) return c
      return {
        ticketType,
        qty: nextValidQty,
      }
    })
  }

  function remove(id: number) {
    cart.value = cart.value.map((c) => {
      if (c.ticketType.id !== id) return c
      return {
        ...c,
        qty: 0,
      }
    })
  }

  return {
    cart,
    selectedLines,
    subtotal,
    totalQty,
    select,
    remove,
  }
}
