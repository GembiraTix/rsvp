<script setup lang="ts">
import { useAdminUsers } from '@/composables/useAdminUsers'
import type { UserProfile, UserRole } from '~~/server/domain/types'

const props = defineProps<{ user: UserProfile | null }>()
const emit = defineEmits<{ saved: [] }>()

const isRoleModalOpen = defineModel<boolean>('open', { required: true })

const { updateUserRole: apiUpdateUserRole } = useAdminUsers()

const toast = useToast()

const selectedNewRole = ref<UserRole>('user')
const isUpdatingRole = ref(false)
const roleErrorMessage = ref('')

watch(
  () => [isRoleModalOpen.value, props.user] as const,
  ([open, user]) => {
    if (open && user) {
      selectedNewRole.value = user.role || 'user'
      roleErrorMessage.value = ''
    }
  },
  { immediate: true },
)

async function handleSaveRole() {
  if (!props.user) return
  isUpdatingRole.value = true
  roleErrorMessage.value = ''

  try {
    await apiUpdateUserRole(props.user.id, selectedNewRole.value)
    toast.add({
      title: 'Role pengguna berhasil diperbarui.',
      color: 'success',
      icon: 'i-lucide-circle-check',
    })
    emit('saved')
    isRoleModalOpen.value = false
  } catch (err: unknown) {
    roleErrorMessage.value = getErrorMessage(err, 'Gagal mengubah role.')
  } finally {
    isUpdatingRole.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isRoleModalOpen"
    title="Ubah Role Pengguna"
    :description="`Atur hak akses untuk ${user?.name || user?.email}`"
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
</template>
