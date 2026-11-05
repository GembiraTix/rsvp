import type { TicketCategory } from '~~/server/domain/types'

export function useTicketCategories() {
  function fetchAll() {
    return useFetch<{ success: boolean; data: TicketCategory[] }>(
      '/api/ticket-categories',
    )
  }

  return { fetchAll }
}
