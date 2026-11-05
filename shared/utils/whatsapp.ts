export function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export function isValidWhatsapp(raw: string): boolean {
  return /^62\d{8,13}$/.test(normalizeWhatsapp(raw))
}
