import type { UserRole } from '~~/server/domain/types'

export const roleOptions: { label: string; value: UserRole }[] = [
  { label: 'User (Pengunjung Biasa)', value: 'user' },
  { label: 'Admin (Dapat Mengelola Acara)', value: 'admin' },
  { label: 'Super Admin (Akses Penuh)', value: 'super_admin' },
]

export function getRoleBadgeColor(
  role: UserRole,
): 'primary' | 'neutral' | undefined {
  const roleColors = new Map<string, 'primary' | 'neutral' | undefined>([
    ['super_admin', 'primary'],
    ['admin', 'neutral'],
    ['user', 'neutral'],
  ])

  return roleColors.get(role) ?? 'neutral'
}
