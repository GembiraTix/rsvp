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

const isCreateModalOpen = ref(false)
const isCreating = ref(false)
const createErrorMessage = ref('')
const createSuccessMessage = ref('')

const createUserSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.'),
  email: z.email('Format email tidak valid.'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.'),
  role: z.enum(['user', 'admin', 'super_admin']),
})

type CreateUserState = z.output<typeof createUserSchema>

const createFormState = reactive<CreateUserState>({
  name: '',
  email: '',
  password: '',
  role: 'admin',
})

async function handleCreateUser(e: FormSubmitEvent<CreateUserState>) {
  isCreating.value = true
  createErrorMessage.value = ''
  createSuccessMessage.value = ''

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
  const roleColors = new Map<string, string>()
  roleColors.set('super_admin', 'primary')
  roleColors.set('admin', 'warning')

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
            <p class="text-sm text-on-surface-variant">
              Kelola pengguna dan tetapkan role administrator.
            </p>
          </div>

          <div class="w-full sm:w-72">
            <UInput
              v-model="searchQuery"
              placeholder="Cari nama, email, role..."
              icon="i-lucide-search"
              size="sm"
              class="w-full"
            />
          </div>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead
            class="bg-surface-container border-b border-outline text-xs font-semibold text-on-surface-variant uppercase"
          >
            <tr>
              <th class="px-6 py-3">Pengguna</th>
              <th class="px-6 py-3">Email</th>
              <th class="px-6 py-3">Role</th>
              <th class="px-6 py-3">Terdaftar</th>
              <th class="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline">
            <tr
              v-for="u in filteredUsers"
              :key="u.id"
              class="hover:bg-surface-container/50"
            >
              <td class="px-6 py-4 font-medium text-on-surface">
                {{ u.name || '-' }}
              </td>
              <td class="px-6 py-4 text-on-surface-variant font-mono text-xs">
                {{ u.email }}
              </td>
              <td class="px-6 py-4">
                <UBadge :color="getRoleBadgeColor(u.role)" variant="subtle">
                  {{ u.role }}
                </UBadge>
              </td>
              <td class="px-6 py-4 text-on-surface-variant text-sm">
                {{
                  formatDate(u.created_at, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                }}
              </td>
              <td class="px-6 py-4 text-right">
                <UButton
                  size="xs"
                  variant="outline"
                  icon="i-lucide-shield-check"
                  @click="openRoleModal(u)"
                >
                  Ubah Role
                </UButton>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td
                colspan="5"
                class="px-6 py-8 text-center text-on-surface-variant"
              >
                Tidak ada pengguna yang ditemukan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Modal: Create New User -->
    <UModal
      v-model:open="isCreateModalOpen"
      title="Tambah Pengguna Baru"
      description="Buat akun pengguna baru dan tetapkan rolenya."
    >
      <template #body>
        <UAlert
          v-if="createErrorMessage"
          :title="createErrorMessage"
          icon="i-lucide-alert-circle"
          color="error"
          variant="subtle"
          class="mb-4"
        />

        <UAlert
          v-if="createSuccessMessage"
          :title="createSuccessMessage"
          icon="i-lucide-check-circle"
          color="success"
          variant="subtle"
          class="mb-4"
        />

        <UForm
          :schema="createUserSchema"
          :state="createFormState"
          class="space-y-4"
          @submit="handleCreateUser"
        >
          <UFormField label="Nama Lengkap" name="name" required>
            <UInput
              v-model="createFormState.name"
              placeholder="contoh: Budi Pratama"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Alamat Email" name="email" required>
            <UInput
              v-model="createFormState.email"
              type="email"
              placeholder="budi@example.com"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Kata Sandi Awal" name="password" required>
            <UInput
              v-model="createFormState.password"
              type="password"
              placeholder="Minimal 6 karakter"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Role Pengguna" name="role" required>
            <select
              v-model="createFormState.role"
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

          <div class="flex justify-end gap-2 pt-4 border-t border-outline">
            <UButton
              color="neutral"
              variant="ghost"
              @click="isCreateModalOpen = false"
            >
              Batal
            </UButton>
            <UButton color="primary" type="submit" :loading="isCreating">
              Simpan Pengguna
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Modal: Change Role -->
    <UModal
      v-model:open="isRoleModalOpen"
      title="Ubah Role Pengguna"
      :description="`Atur hak akses untuk ${selectedUserForRole?.name || selectedUserForRole?.email}`"
    >
      <template #body>
        <UAlert
          v-if="roleErrorMessage"
          :title="roleErrorMessage"
          icon="i-lucide-alert-circle"
          color="error"
          variant="subtle"
          class="mb-4"
        />

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
