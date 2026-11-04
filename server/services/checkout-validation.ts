import type { TicketType } from '#server/domain/types'
import { isValidTicketQty } from '../../shared/utils/ticket-qty'

export class CheckoutValidationError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message)
  }
}

export interface ResolvedCheckoutLine {
  ticketTypeId: number
  name: string
  unitPrice: number
  qty: number
}

export function resolveCheckoutLines(
  ticketTypes: TicketType[],
  lines: { ticketTypeId: number; qty: number }[],
): ResolvedCheckoutLine[] {
  const seen = new Set<number>()

  return lines.map((line) => {
    if (seen.has(line.ticketTypeId)) {
      throw new CheckoutValidationError('Tipe tiket duplikat pada pesanan.')
    }
    seen.add(line.ticketTypeId)

    const ticketType = ticketTypes.find((tt) => tt.id === line.ticketTypeId)
    if (!ticketType) {
      throw new CheckoutValidationError('Tipe tiket tidak ditemukan.')
    }
    if (!ticketType.is_active) {
      throw new CheckoutValidationError('Tipe tiket tidak tersedia.')
    }
    if (ticketType.price < 0) {
      throw new CheckoutValidationError('Harga tipe tiket tidak valid.')
    }
    if (!isValidTicketQty(ticketType, line.qty)) {
      throw new CheckoutValidationError(
        `Jumlah tiket '${ticketType.name}' tidak valid.`,
      )
    }

    return {
      ticketTypeId: ticketType.id,
      name: ticketType.name,
      unitPrice: ticketType.price,
      qty: line.qty,
    }
  })
}
