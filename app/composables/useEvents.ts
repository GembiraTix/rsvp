import type { Event } from '~~/server/domain/types'

export interface CreateEventBody {
  title: string
  location: string
  startsAt: string
  endsAt?: string | null
  description?: string | null
  imageUrl?: string | null
}

export function useEvents() {
  function fetchAll() {
    return useFetch<{ success: boolean; data: Event[] }>('/api/events')
  }

  function fetchBySlug(slug: MaybeRefOrGetter<string>) {
    return useFetch<{ success: boolean; data: Event }>(
      () => `/api/events/${toValue(slug)}`,
    )
  }

  function fetchCreatedByUser(userId: MaybeRefOrGetter<string | undefined>) {
    return useFetch<{ success: boolean; data: Event[] }>(
      () => `/api/events/user/${toValue(userId)}`,
      {
        immediate: Boolean(toValue(userId)),
      },
    )
  }

  async function createEvent(body: CreateEventBody) {
    return $fetch<{ success: boolean; data: Event }>('/api/events', {
      method: 'POST',
      body,
    })
  }

  async function deleteEvent(id: number) {
    return $fetch<{ success: boolean }>(`/api/events/${id}`, {
      method: 'DELETE',
    })
  }

  return {
    fetchAll,
    fetchBySlug,
    fetchCreatedByUser,
    createEvent,
    deleteEvent,
  }
}
