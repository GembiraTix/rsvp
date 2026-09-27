import type { UserProfile } from '~~/server/domain/types'

export function useUserProfile() {
  function fetchProfile() {
    return useFetch<{ success: boolean; data: UserProfile }>('/api/users/me')
  }

  async function updateProfile(name: string) {
    return $fetch<{ success: boolean; data: UserProfile }>('/api/users/me', {
      method: 'PUT',
      body: { name },
    })
  }

  return {
    fetchProfile,
    updateProfile,
  }
}
