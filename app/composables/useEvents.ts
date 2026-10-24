import type { Event } from '~~/server/domain/types'

export interface CreateEventBody {
  title: string
  location: string
  startsAt: string
  endsAt?: string | null
  description?: string | null
  imageUrl?: string | null
}

export interface UpdateEventBody {
  title?: string | null
  location?: string | null
  startsAt?: string
  endsAt?: string | null
  description?: string | null
  imageUrl?: string | null
  registrationLimit?: number | null
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

  async function updateEvent(id: number, body: UpdateEventBody) {
    return $fetch<{ success: boolean; data: Event }>(`/api/events/${id}`, {
      method: 'PUT',
      body,
    })
  }

  async function updateRegistrationLimit(
    id: number,
    body: { enabled: boolean; limit?: number | null },
  ) {
    return $fetch<{ success: boolean; data: Event }>(
      `/api/events/${id}/limit`,
      {
        method: 'PUT',
        body,
      },
    )
  }

  async function uploadEventImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return $fetch<{ success: boolean; data: { url: string } }>(
      '/api/events/upload',
      {
        method: 'POST',
        body: formData,
      },
    )
  }

  return {
    fetchAll,
    fetchBySlug,
    createEvent,
    updateEvent,
    updateRegistrationLimit,
    deleteEvent,
    uploadEventImage,
  }
}
