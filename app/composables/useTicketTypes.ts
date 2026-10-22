import type { TicketType, TicketTypeKind } from '~~/server/domain/types'

export interface CreateTicketTypeBody {
  name: string
  description?: string | null
  kind?: TicketTypeKind
  price?: number
  capacity?: number | null
  minQty?: number
  maxQty?: number
  multipleOf?: number
  isActive?: boolean
}

export function useTicketTypes() {
  function fetchByEvent(slug: MaybeRefOrGetter<string>) {
    return useFetch<{ success: boolean; data: TicketType[] }>(
      () => `/api/events/${toValue(slug)}/ticket-types`,
    )
  }

  async function createTicketType(
    slug: string,
    body: CreateTicketTypeBody,
  ) {
    return $fetch<{ success: boolean; data: TicketType }>(
      `/api/events/${slug}/ticket-types`,
      {
        method: 'POST',
        body,
      },
    )
  }

  return {
    fetchByEvent,
    createTicketType,
  }
}
