import { z } from 'zod'
import type { TicketType } from '~~/server/domain/types'
import { clampQty, isValidTicketQty } from '~~/shared/utils/ticket-qty'

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

export function useTicketCart(
  iticketTypes: MaybeRefOrGetter<TicketType[]>,
): TicketCart {
  const ticketTypes = computed(() => toValue(iticketTypes))

  const cart = ref<CartLine[]>([])

  watch(
    ticketTypes,
    (types) => {
      cart.value = types.map((t) => ({
        ticketType: t,
        qty: cart.value.find((c) => c.ticketType.id === t.id)?.qty ?? 0,
      }))
    },
    { immediate: true },
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

    cart.value = cart.value.map((c) => {
      if (c.ticketType.id !== id) return c
      return {
        ticketType,
        qty: clampQty(ticketType, ticketType.multiple_of),
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

      if (!isValidTicketQty(ticketType, d.qty)) {
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
