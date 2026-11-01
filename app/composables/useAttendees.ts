import type { Rsvp } from '~~/server/domain/types'

export function useAttendees() {
  function fetchByEvent(slug: MaybeRefOrGetter<string>) {
    return useFetch<{ success: boolean; data: Rsvp[] }>(
      () => `/api/events/${toValue(slug)}/attendees`,
    )
  }

  async function removeAttendee(slug: string, rsvpId: number) {
    return $fetch<{ success: boolean; data: { id: number } }>(
      `/api/events/${slug}/attendees/${rsvpId}`,
      { method: 'DELETE' },
    )
  }

  return { fetchByEvent, removeAttendee }
}
