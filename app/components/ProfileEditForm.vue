<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useUserProfile } from '@/composables/useUserProfile'

const user = useSupabaseUser()

const { fetchProfile, updateProfile: apiUpdateProfile } = useUserProfile()
const { data: profileRes, refresh: refreshProfile } = await fetchProfile()
const profile = computed(() => profileRes.value?.data || null)

const isUpdatingProfile = ref(false)
const profileErrorMessage = ref('')
const profileSuccessMessage = ref('')

const profileFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.'),
  profile: z.instanceof(File).optional(), // TODO: implement in the future
})

type ProfileFormState = z.output<typeof profileFormSchema>

const profileFormState = reactive<ProfileFormState>({
  name: profile.value?.name || '',
  profile: undefined,
})

async function handleUpdateProfile(e: FormSubmitEvent<ProfileFormState>) {
  if (!user.value) return
  isUpdatingProfile.value = true
  profileErrorMessage.value = ''
  profileSuccessMessage.value = ''

  try {
    await apiUpdateProfile(e.data.name)
    await refreshProfile()
    profileSuccessMessage.value = 'Profil berhasil diperbarui!'
  } catch (err: unknown) {
    profileErrorMessage.value = getErrorMessage(err, 'Gagal memperbarui profil.')
  } finally {
    isUpdatingProfile.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-bold">Profil pengguna</h2>
    </template>

    <UAlert
      v-if="profileErrorMessage"
      :title="profileErrorMessage"
      icon="i-lucide-alert-circle"
      color="error"
      variant="subtle"
      class="my-4"
      close
      @update:open="profileErrorMessage = ''"
    />

    <UAlert
      v-if="profileSuccessMessage"
      :title="profileSuccessMessage"
      icon="i-lucide-check-circle"
      color="success"
      class="my-4"
      variant="subtle"
      close
      @update:open="profileSuccessMessage = ''"
    />

    <div class="grid gap-4 md:grid-cols-3">
      <div class="flex items-center gap-4">
        <UFileUpload
          v-slot="{ open }"
          v-model="profileFormState.profile"
          accept="image/*"
          icon="i-lucide-upload-cloud"
          label="Pilih atau seret gambar foto profil baru ke sini"
          description="PNG, JPG, WEBP hingga 5MB"
          class="w-full"
          disabled
        >
          <div class="flex flex-col gap-4 items-center">
            <UAvatar
              :text="
                (profile?.name || user?.email || 'U').charAt(0).toUpperCase()
              "
              class="size-36 aspect-square"
            />
            <UButton
              variant="outline"
              label="Unggah foto baru"
              disabled
              @click="open()"
            />
          </div>
        </UFileUpload>
      </div>

      <UForm
        :schema="profileFormSchema"
        :state="profileFormState"
        class="space-y-4 col-span-2"
        @submit="handleUpdateProfile"
      >
        <UFormField label="Email">
          <UInput :model-value="user?.email" disabled class="w-full" />
        </UFormField>

        <UFormField label="Nama Lengkap / Nama Tampilan" name="name">
          <UInput
            id="name"
            v-model="profileFormState.name"
            placeholder="contoh: Dr. Jane Doe"
            name="name"
            class="w-full"
          />
        </UFormField>

        <div class="pt-4 flex justify-end gap-2">
          <UButton
            color="primary"
            type="submit"
            :loading="isUpdatingProfile"
          >
            Simpan Perubahan
          </UButton>
        </div>
      </UForm>
    </div>
  </UCard>
</template>
