<script setup lang="ts">
import { useAdminUsers } from '@/composables/useAdminUsers'
import type { UserProfile } from '~~/server/domain/types'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Manajemen Pengguna - Admin',
})

const { fetchUsers } = useAdminUsers()
const { data: usersRes, refresh: refreshUsers } = await fetchUsers()
const usersList = computed(() => usersRes.value?.data || [])

const searchQuery = ref('')

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
    meta: {
      class: {
        th: 'text-center',
      },
    },
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
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
        Manajemen Pengguna
      </h2>

      <div class="flex items-center gap-3">
        <UButton
          color="primary"
          icon="i-lucide-user-plus"
          @click="isCreateModalOpen = true"
        >
          Tambah Pengguna Baru
        </UButton>
      </div>
    </div>

    <UCard class="border-outline" :ui="{ body: 'p-0 sm:p-0' }">
      <UTable
        v-model:global-filter="searchQuery"
        :data="usersList"
        :columns="usersColumns"
      >
        <template #name-cell="{ row }">
          {{ row.original.name || '-' }}
        </template>

        <template #email-cell="{ row }">
          <span class="font-mono">
            {{ row.original.email }}
          </span>
        </template>

        <template #role-cell="{ row }">
          {{ row.original.role }}
        </template>

        <template #action-cell="{ row }">
          <div class="text-right">
            <UButton
              icon="i-lucide-settings"
              variant="subtle"
              @click="openRoleModal(row.original)"
            >
              Ubah Role
            </UButton>
          </div>
        </template>

        <template #empty>
          <UEmpty
            icon="i-lucide-user"
            title="Tidak ada pengguna yang ditemukan."
          >
            <template #actions>
              <UButton
                color="primary"
                icon="i-lucide-user-plus"
                @click="isCreateModalOpen = true"
              >
                Tambah Pengguna Baru
              </UButton>
            </template>
          </UEmpty>
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
