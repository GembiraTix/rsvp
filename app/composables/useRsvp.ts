import type { Rsvp, RsvpWithEvent } from '~/../../server/domain/types'

type RsvpDetail = Rsvp & {
  events: {
    id: number
    title: string | null
    location: string | null
    starts_at: string | null
    ends_at: string | null
  } | null
}

export function useRsvp() {
  function fetchByToken(token: MaybeRefOrGetter<string>) {
    return useFetch(() => `/api/rsvp/${toValue(token)}`, {
      transform: (res: { success: boolean; data: RsvpDetail }) => res.data,
    })
  }

  function fetchJoined() {
    return useFetch<{ success: boolean; data: RsvpWithEvent[] }>(
      '/api/users/me/rsvps',
    )
  }

  function fetchAttendingCount(eventId: MaybeRefOrGetter<number>) {
    return useFetch<{ success: boolean; data: { count: number } }>(
      () => `/api/public/events/${toValue(eventId)}/rsvp-count`,
    )
  }

  async function getRsvpByEventAndEmail(
    eventId: number,
    email: string,
  ): Promise<Rsvp | null> {
    try {
      const res = await $fetch<{ success: boolean; data: Rsvp }>(
        '/api/rsvp/check',
        {
          query: { eventId, email },
        },
      )
      return res.data
    } catch {
      return null
    }
  }

  const submit = (payload: {
    eventId: number
    name: string
    email: string
    customQuestionAnswer?: string
    identityType?: string
    identityNumber?: string
    whatsapp?: string
    gender?: string
  }) =>
    $fetch('/api/rsvp', {
      method: 'POST',
      body: payload,
    })

  return {
    fetchByToken,
    fetchJoined,
    fetchAttendingCount,
    getRsvpByEventAndEmail,
    submit,
  }
}
