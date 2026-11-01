import { describe, expect, it } from 'vitest'
import { resolveEventSidebarPanel } from '../app/utils/event-sidebar'

const base = {
  isRegistered: false,
  isLimitReached: false,
  hasTickets: false,
  isLoggedIn: false,
}

describe('resolveEventSidebarPanel', () => {
  it('shows confirmed when registered, even if quota is full or tickets exist', () => {
    expect(
      resolveEventSidebarPanel({ ...base, isRegistered: true }),
    ).toBe('confirmed')
    expect(
      resolveEventSidebarPanel({
        isRegistered: true,
        isLimitReached: true,
        hasTickets: true,
        isLoggedIn: true,
      }),
    ).toBe('confirmed')
  })

  it('shows quota_full when limit reached, before buy_tickets', () => {
    expect(
      resolveEventSidebarPanel({ ...base, isLimitReached: true }),
    ).toBe('quota_full')
    expect(
      resolveEventSidebarPanel({
        ...base,
        isLimitReached: true,
        hasTickets: true,
      }),
    ).toBe('quota_full')
  })

  it('shows buy_tickets for paid events regardless of login state', () => {
    expect(resolveEventSidebarPanel({ ...base, hasTickets: true })).toBe(
      'buy_tickets',
    )
    expect(
      resolveEventSidebarPanel({ ...base, hasTickets: true, isLoggedIn: true }),
    ).toBe('buy_tickets')
  })

  it('shows rsvp_form for free events when logged in', () => {
    expect(resolveEventSidebarPanel({ ...base, isLoggedIn: true })).toBe(
      'rsvp_form',
    )
  })

  it('shows guest_form for free events when logged out', () => {
    expect(resolveEventSidebarPanel(base)).toBe('guest_form')
  })
})
