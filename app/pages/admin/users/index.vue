<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useUserProfile } from '@/composables/useUserProfile'
import { useAdminUsers } from '@/composables/useAdminUsers'
import type { UserProfile, UserRole } from '~~/server/domain/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Manajemen Pengguna - Admin',
})

const { fetchProfile } = useUserProfile()
const { data: profileRes } = await fetchProfile()
const currentUser = computed(() => profileRes.value?.data || null)

// Ensure only super_admin can view this page
watch(
  currentUser,
  (val) => {
    if (val && val.role !== 'super_admin') {
      navigateTo('/users')
    }
  },
  { immediate: true },
)

const {
  fetchUsers,
  createUser: apiCreateUser,
  updateUserRole: apiUpdateUserRole,
} = useAdminUsers()
const { data: usersRes, refresh: refreshUsers } = await fetchUsers()
const usersList = computed(() => usersRes.value?.data || [])

const searchQuery = ref('')
const filteredUsers = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) {
    return usersList.value
  }

  return usersList.value.filter(
    (u) =>
      u.email.toLowerCase().includes(q) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)),
  )
})

const usersColumns: TableColumn<UserProfile>[] = [
  {
    accessorKey: 'name',
    header: 'Pengguna',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
  {
    accessorKey: 'created_at',
    header: 'Terdaftar',
    cell: ({ row }) =>
      formatDate(row.original.created_at, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
  },
  {
    id: 'action',
    header: 'Aksi',
  },
]

  try {
    await apiCreateUser({
      name: e.data.name,
      email: e.data.email,
      password: e.data.password,
      role: e.data.role,
    })
    await refreshUsers()
    createSuccessMessage.value = 'Pengguna berhasil dibuat!'
    createFormState.name = ''
    createFormState.email = ''
    createFormState.password = ''
    createFormState.role = 'admin'
    setTimeout(() => {
      isCreateModalOpen.value = false
      createSuccessMessage.value = ''
    }, 1500)
  } catch (err: unknown) {
    createErrorMessage.value =
      err instanceof Error ? err.message : 'Gagal membuat pengguna.'
  } finally {
    isCreating.value = false
  }
}

// Role editing modal
const isRoleModalOpen = ref(false)
const selectedUserForRole = ref<UserProfile | null>(null)
const selectedNewRole = ref<UserRole>('user')
const isUpdatingRole = ref(false)
const roleErrorMessage = ref('')

function openRoleModal(user: UserProfile) {
  selectedUserForRole.value = user
  selectedNewRole.value = user.role || 'user'
  roleErrorMessage.value = ''
  isRoleModalOpen.value = true
}

async function handleSaveRole() {
  if (!selectedUserForRole.value) return
  isUpdatingRole.value = true
  roleErrorMessage.value = ''

  try {
    await apiUpdateUserRole(selectedUserForRole.value.id, selectedNewRole.value)
    await refreshUsers()
    isRoleModalOpen.value = false
  } catch (err: unknown) {
    roleErrorMessage.value =
      err instanceof Error ? err.message : 'Gagal mengubah role.'
  } finally {
    isUpdatingRole.value = false
  }
}

const roleOptions: { label: string; value: UserRole }[] = [
  { label: 'User (Pengunjung Biasa)', value: 'user' },
  { label: 'Admin (Dapat Mengelola Acara)', value: 'admin' },
  { label: 'Super Admin (Akses Penuh)', value: 'super_admin' },
]

function getRoleBadgeColor(role: UserRole) {
  const roleColors = new Map<
    string,
    | 'success'
    | 'error'
    | 'primary'
    | 'warning'
    | 'info'
    | 'neutral'
    | 'secondary'
    | undefined
  >()
  roleColors.set('super_admin', 'primary')
  roleColors.set('admin', 'neutral')
  roleColors.set('user', 'neutral')

  const color = roleColors.get(role)

  return color ?? 'neutral'
}
</script>

<template>
  <div class="py-8 max-w-6xl mx-auto px-4 space-y-6">
    <div class="flex items-center justify-between">
      <UButton
        to="/users"
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
      >
        Kembali ke Dasbor
      </UButton>

      <UButton
        color="primary"
        icon="i-lucide-user-plus"
        @click="isCreateModalOpen = true"
      >
        Tambah Pengguna Baru
      </UButton>
    </div>

    <UCard class="border-outline" :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1
              class="text-xl font-bold text-on-surface flex items-center gap-2"
            >
              <UIcon name="i-lucide-users" class="w-6 h-6 text-primary" />
              Manajemen Pengguna
            </h1>
          </div>

          <div class="w-full sm:w-72">
            <UInput
              v-model="searchQuery"
              placeholder="Cari nama, email, role..."
              icon="i-lucide-search"
              class="w-full"
            />
          </div>
        </div>
      </template>

      <UTable :data="filteredUsers" :columns="usersColumns">
        <template #name-cell="{ row }">
          <span class="font-medium text-on-surface">
            {{ row.original.name || '-' }}
          </span>
        </template>

        <template #email-cell="{ row }">
          <span class="text-on-surface-variant font-mono text-xs">
            {{ row.original.email }}
          </span>
        </template>

        <template #role-cell="{ row }">
          <UBadge
            :color="getRoleBadgeColor(row.original.role)"
            variant="outline"
          >
            {{ row.original.role }}
          </UBadge>
        </template>

        <template #action-cell="{ row }">
          <div class="text-right">
            <UButton
              size="sm"
              variant="outline"
              @click="openRoleModal(row.original)"
            >
              Ubah Role
            </UButton>
          </div>
        </template>

        <template #empty>
          <p class="px-6 py-8 text-center text-on-surface-variant">
            Tidak ada pengguna yang ditemukan.
          </p>
        </template>
      </UTable>
    </UCard>

        <div class="space-y-4 py-2">
          <UFormField label="Pilih Role Baru">
            <select
              v-model="selectedNewRole"
              class="w-full rounded-md border border-outline bg-surface-container px-3 py-2 text-sm text-on-surface"
            >
              <option
                v-for="opt in roleOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isRoleModalOpen = false"
          >
            Batal
          </UButton>
          <UButton
            color="primary"
            :loading="isUpdatingRole"
            @click="handleSaveRole"
          >
            Simpan Perubahan
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
