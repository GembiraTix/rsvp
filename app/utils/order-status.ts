type OrderStatusStyle = {
  label: string
  color: 'success' | 'error' | 'warning' | 'info' | 'neutral'
}

export const orderStatusStyles: Record<string, OrderStatusStyle> = {
  pending: { label: 'Menunggu pembayaran', color: 'warning' },
  paid: { label: 'Dibayar', color: 'success' },
  cancelled: { label: 'Dibatalkan', color: 'error' },
  expired: { label: 'Kedaluwarsa', color: 'error' },
  failed: { label: 'Gagal', color: 'error' },
  refunded: { label: 'Dana dikembalikan', color: 'info' },
  partial_refund: { label: 'Pengembalian sebagian', color: 'info' },
  draft: { label: 'Draf', color: 'neutral' },
}

export function orderStatusStyle(status: string): OrderStatusStyle {
  return orderStatusStyles[status] ?? { label: status, color: 'neutral' }
}

export function isOrderExpired(order: { expires_at: string }): boolean {
  return new Date(order.expires_at).getTime() <= Date.now()
}

export function isOrderPayable(order: {
  status: string
  expires_at: string
}): boolean {
  return order.status === 'pending' && !isOrderExpired(order)
}
