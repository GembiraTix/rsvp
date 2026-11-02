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

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
