import type { TimeLike } from 'node:fs'

/**
 * turns js dates into formatted strings, defaults to Asia/Jakarta zone
 * */
export function formatDate(
  date: TimeLike,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const usedOpts = {
    ...opts,
    timeZone: 'Asia/Jakarta',
  }
  const formatted = new Intl.DateTimeFormat('id-ID', usedOpts) // TODO: set timezone
    .format(new Date(date))
  return formatted
}
