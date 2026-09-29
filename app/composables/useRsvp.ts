import type { Rsvp } from '~/../../server/domain/types'

type RsvpWithEvent = Rsvp & {
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
      transform: (res: { success: boolean; data: RsvpWithEvent }) => res.data,
    })
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

  function cancel(token: string) {
    return $fetch(`/api/rsvp/${token}/cancel`, { method: 'POST' })
  }

  const submit = (payload: {
    eventId: number
    name: string
    email: string
    organization?: string
  }) =>
    $fetch<{ success: boolean; token: string }>('/api/rsvp', {
      method: 'POST',
      body: payload,
    })

  return { fetchByToken, getRsvpByEventAndEmail, cancel, submit }
}
