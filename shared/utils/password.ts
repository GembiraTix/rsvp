import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Kata sandi minimal 8 karakter.')
  .max(72, 'Kata sandi maksimal 72 karakter.')

export const passwordMatchRefinement = {
  message: 'Konfirmasi kata sandi tidak cocok.',
  path: ['confirmPassword' as const],
}

export function createPasswordChangeSchema() {
  return z
    .object({
      newPassword: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine(
      (data) => data.newPassword === data.confirmPassword,
      passwordMatchRefinement,
    )
}

const WEAK_PASSWORD_MESSAGES: Record<string, string> = {
  pwned: 'Kata sandi ini dikenal bocor dan mudah ditebak. Pilih kata sandi yang berbeda.',
  length: 'Kata sandi terlalu pendek sesuai pengaturan keamanan akun.',
  characters: 'Kata sandi belum memuat jenis karakter yang diwajibkan.',
}

export function weakPasswordErrorMessage(reasons: unknown): string {
  if (Array.isArray(reasons)) {
    for (const reason of reasons) {
      const message = WEAK_PASSWORD_MESSAGES[reason]
      if (message) return message
    }
  }
  return 'Kata sandi tidak memenuhi persyaratan keamanan.'
}
