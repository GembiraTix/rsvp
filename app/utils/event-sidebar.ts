export type EventSidebarPanel =
  'confirmed' | 'quota_full' | 'buy_tickets' | 'rsvp_form' | 'guest_form'

/**
 * resolves which panel the event-page sidebar shows
 * Priority:
 * 1. registered
 * 2. quota full
 * 3. buy tickets
 * 4. RSVP form
 */
export function resolveEventSidebarPanel(input: {
  isRegistered: boolean
  isLimitReached: boolean
  hasTickets: boolean
  isLoggedIn: boolean
}): EventSidebarPanel {
  if (input.isRegistered) return 'confirmed'
  if (input.isLimitReached) return 'quota_full'
  if (input.hasTickets) return 'buy_tickets'
  return input.isLoggedIn ? 'rsvp_form' : 'guest_form'
}
