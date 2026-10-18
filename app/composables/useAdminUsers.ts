import type { UserProfile, UserRole } from '~~/server/domain/types'

export interface CreateAdminUserBody {
  email: string
  name: string
  password: string
  role: UserRole
}

export function useAdminUsers() {
  function fetchUsers() {
    return useFetch<{ success: boolean; data: UserProfile[] }>(
      '/api/admin/users',
    )
  }

  async function createUser(body: CreateAdminUserBody) {
    return $fetch<{ success: boolean; data: UserProfile }>(
      '/api/admin/users',
      {
        method: 'POST',
        body,
      },
    )
  }

  async function updateUserRole(userId: string, role: UserRole) {
    return $fetch<{ success: boolean; data: UserProfile }>(
      `/api/admin/users/${userId}/role`,
      {
        method: 'PATCH',
        body: { role },
      },
    )
  }

  return {
    fetchUsers,
    createUser,
    updateUserRole,
  }
}
