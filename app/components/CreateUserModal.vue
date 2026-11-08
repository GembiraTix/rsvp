<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useAdminUsers } from '@/composables/useAdminUsers'

const emit = defineEmits<{ saved: [] }>()

const isCreateModalOpen = defineModel<boolean>('open', { required: true })

const { createUser: apiCreateUser } = useAdminUsers()

const toast = useToast()

const isCreating = ref(false)
const createErrorMessage = ref('')

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

  try {
    await apiCreateUser({
      name: e.data.name,
      email: e.data.email,
      password: e.data.password,
      role: e.data.role,
    })
    toast.add({
      title: 'Pengguna berhasil dibuat.',
      color: 'success',
      icon: 'i-lucide-circle-check',
    })
    emit('saved')
    isCreateModalOpen.value = false
    createFormState.name = ''
    createFormState.email = ''
    createFormState.password = ''
    createFormState.role = 'admin'
  } catch (err: unknown) {
    createErrorMessage.value = getErrorMessage(err, 'Gagal membuat pengguna.')
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
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
</template>
