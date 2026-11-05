import { z } from 'zod'

// Attendee PII travels via sessionStorage, not URL params (deliberate
// deviation from the URL-param convention; flagged in the RSVP-49 PR).
export type AttendeeDraft = {
  ticketTypeId: number
  name: string
  identityType: string
  identityNumber: string
  email: string
  whatsapp: string
  gender: string
}

const draftSchema = z.array(
  z.object({
    ticketTypeId: z.number().int().positive(),
    name: z.string(),
    identityType: z.string(),
    identityNumber: z.string(),
    email: z.string(),
    whatsapp: z.string(),
    gender: z.string(),
  }),
)

function storageKey(slug: string): string {
  return `gembiratix:attendees:${slug}`
}

export function useAttendeeDraft(slug: MaybeRefOrGetter<string>) {
  function load(): AttendeeDraft[] {
    if (!import.meta.client) return []

    try {
      const raw = sessionStorage.getItem(storageKey(toValue(slug)))
      if (!raw) return []

      const { data, success } = draftSchema.safeParse(JSON.parse(raw))
      return success ? data : []
    } catch {
      return []
    }
  }

  function save(draft: AttendeeDraft[]) {
    if (!import.meta.client) return
    sessionStorage.setItem(storageKey(toValue(slug)), JSON.stringify(draft))
  }

  function clear() {
    if (!import.meta.client) return
    sessionStorage.removeItem(storageKey(toValue(slug)))
  }

  return { load, save, clear }
}
