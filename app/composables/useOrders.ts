import type {
  OrderWithEvent,
  TicketWithTypeName,
} from '~~/server/domain/types'

export function useOrders() {
  function fetchOrders() {
    return useFetch<{ success: boolean; data: OrderWithEvent[] }>('/api/orders')
  }

  function fetchOrder(id: string) {
    return useFetch<{ success: boolean; data: OrderWithEvent }>(
      () => `/api/orders/${id}`,
    )
  }

  function fetchTickets(orderId: string) {
    return useFetch<{ success: boolean; data: TicketWithTypeName[] }>(
      () => `/api/orders/${orderId}/tickets`,
    )
  }

  async function resumePayment(orderId: string) {
    return $fetch<{ success: boolean; data: { redirectUrl: string } }>(
      `/api/orders/${orderId}/resume`,
      { method: 'POST' },
    )
  }

  return {
    fetchOrders,
    fetchOrder,
    fetchTickets,
    resumePayment,
  }
}
