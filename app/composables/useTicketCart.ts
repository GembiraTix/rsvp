import type { TicketType } from '~~/server/domain/types'
import { computed } from 'vue'
import { z } from 'zod'

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
  encode(selectedLines: SelectedCartLine[]): string
  decode(param: string): CartLine[]
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

  /**
   * encodes current cart value into URL-safe query parameter value.
   * this is the opposide of decode
   * */
  function encode(selectedLines: SelectedCartLine[]): string {
    const lines = selectedLines.map((line) => ({
      ticketTypeId: line.ticketType.id,
      qty: line.qty,
    }))

    const cartParam = encodeURIComponent(JSON.stringify(lines))
    return cartParam
  }

  /**
   * sets the cart value from provided parameter value.
   * this is the opposite of encode
   * */
  function decode(param: string): CartLine[] {
    if (!param) return []

    const cartRaw = param

    const cartSchema = z.array(
      z.object({
        ticketTypeId: z.number().int(),
        qty: z.number().int().positive(),
      }),
    )

    const { data, error } = cartSchema.safeParse(JSON.parse(cartRaw))
    if (error || !data) {
      throw createError('cart from query params is malformed') // TODO: better error handling
    }

    return data.map((d) => {
      const ticketType = ticketTypes.value.find(
        (tt) => tt.id === d.ticketTypeId,
      )
      if (!ticketType) {
        throw createError('invalid ticket type id') // TODO: better error handling
      }

      const { min_qty, max_qty, multiple_of } = ticketType
      if (
        d.qty < min_qty ||
        d.qty > max_qty ||
        d.qty % multiple_of !== 0
      ) {
        throw createError('invalid ticket quantity')
      }

      return { ...d, ticketType }
    })
  }

  return {
    cart,
    selectedLines,
    subtotal,
    totalQty,
    encode,
    decode,
    select,
    remove,
  }
}
