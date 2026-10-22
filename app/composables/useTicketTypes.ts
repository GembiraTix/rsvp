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

export type UpdateTicketTypeBody = CreateTicketTypeBody

export interface DeleteTicketTypeResult {
  id: number
  deleted: boolean
  deactivated: boolean
}

export function useTicketTypes() {
  function fetchByEvent(slug: MaybeRefOrGetter<string>) {
    return useFetch<{ success: boolean; data: TicketType[] }>(
      () => `/api/events/${toValue(slug)}/ticket-types`,
    )
  }

  function fetchPublicByEvent(slug: MaybeRefOrGetter<string>) {
    return useFetch<{ success: boolean; data: TicketType[] }>(
      () => `/api/public/events/${toValue(slug)}/ticket-types`,
    )
  }

  async function createTicketType(id: number, body: CreateTicketTypeBody) {
    return $fetch<{ success: boolean; data: TicketType }>(
      `/api/events/${id}/ticket-types`,
      {
        method: 'POST',
        body,
      },
    )
  }

  async function updateTicketType(
    id: number,
    ticketTypeId: number,
    body: UpdateTicketTypeBody,
  ) {
    return $fetch<{ success: boolean; data: TicketType }>(
      `/api/events/${id}/ticket-types/${ticketTypeId}`,
      {
        method: 'PUT',
        body,
      },
    )
  }

  async function deleteTicketType(id: number, ticketTypeId: number) {
    return $fetch<{ success: boolean; data: DeleteTicketTypeResult }>(
      `/api/events/${id}/ticket-types/${ticketTypeId}`,
      {
        method: 'DELETE',
      },
    )
  }

  return {
    fetchByEvent,
    fetchPublicByEvent,
    createTicketType,
    updateTicketType,
    deleteTicketType,
  }
}
