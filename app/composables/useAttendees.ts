import type { Rsvp } from '~~/server/domain/types'

export function useAttendees() {
  function fetchByEvent(eventId: MaybeRefOrGetter<number>) {
    return useFetch<{ success: boolean; data: Rsvp[] }>(
      () => `/api/events/${toValue(eventId)}/attendees`,
    )
  }

  async function removeAttendee(eventId: number, rsvpId: number) {
    return $fetch<{ success: boolean; data: { id: number } }>(
      `/api/events/${eventId}/attendees/${rsvpId}`,
      { method: 'DELETE' },
    )
  }

  return { fetchByEvent, removeAttendee }
}
