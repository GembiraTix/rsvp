<script setup lang="ts">
import { useAdminUsers } from '@/composables/useAdminUsers'
import type { UserProfile } from '~~/server/domain/types'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  middleware: ['auth', 'super-admin'],
})

useSeoMeta({
  title: 'Manajemen Pengguna - Admin',
})

const { fetchUsers } = useAdminUsers()
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

const isCreateModalOpen = ref(false)

const isRoleModalOpen = ref(false)
const selectedUserForRole = ref<UserProfile | null>(null)

function openRoleModal(user: UserProfile) {
  selectedUserForRole.value = user
  isRoleModalOpen.value = true
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

    <CreateUserModal v-model:open="isCreateModalOpen" @saved="refreshUsers" />

    <RoleModal
      v-model:open="isRoleModalOpen"
      :user="selectedUserForRole"
      @saved="refreshUsers"
    />
  </div>
</template>
