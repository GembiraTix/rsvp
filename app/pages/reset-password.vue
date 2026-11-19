<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  createPasswordChangeSchema,
  weakPasswordErrorMessage,
} from '~~/shared/utils/password'

useSeoMeta({
  title: 'Setel Ulang Kata Sandi - GembiraTix',
})

definePageMeta({
  layout: 'auth',
})

const supabase = useSupabaseClient()
const toast = useToast()

const errorMessage = ref('')
const isLoading = ref(false)
const sessionReady = ref(false)
const isSuccess = ref(false)

onMounted(async () => {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session) {
    errorMessage.value =
      'Tautan reset kata sandi tidak valid atau telah kedaluwarsa.'
    return
  }

  sessionReady.value = true
})

const formStateSchema = createPasswordChangeSchema()

type FormState = z.output<typeof formStateSchema>

const formState = reactive<FormState>({
  newPassword: '',
  confirmPassword: '',
})

async function handleSetPassword(e: FormSubmitEvent<FormState>) {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const { error } = await supabase.auth.updateUser({
      password: e.data.newPassword,
    })

    if (error) {
      if (error.code === 'same_password') {
        errorMessage.value =
          'Kata sandi baru tidak boleh sama dengan kata sandi lama.'
      } else if (error.code === 'weak_password') {
        errorMessage.value = weakPasswordErrorMessage(
          (error as { reasons?: string[] }).reasons,
        )
      } else if (
        error.status === 401 ||
        error.code === 'session_not_found' ||
        error.code === 'bad_jwt'
      ) {
        sessionReady.value = false
        errorMessage.value =
          'Sesi reset telah berakhir. Silakan minta tautan reset yang baru.'
      } else {
        errorMessage.value = 'Gagal mengubah kata sandi. Silakan coba lagi.'
      }
      return
    }

    await supabase.auth.signOut()

    toast.add({
      title: 'Kata sandi berhasil diubah.',
      color: 'success',
      icon: 'i-lucide-circle-check',
    })

    isSuccess.value = true
  } catch {
    errorMessage.value = 'Gagal mengubah kata sandi. Silakan coba lagi.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <UCard class="border-outline shadow-md">
      <template #header>
        <div class="text-center space-y-1">
          <h1 class="text-2xl font-bold text-on-surface">
            Setel Ulang Kata Sandi
          </h1>
          <p class="text-on-surface-variant">
            Masukkan kata sandi baru untuk akun Anda
          </p>
        </div>
      </template>

      <UAlert
        v-if="errorMessage"
        title="Ada kesalahan!"
        :description="errorMessage"
        color="error"
        icon="i-lucide-triangle-alert"
        variant="subtle"
      />

      <template v-else-if="isSuccess">
        <div class="space-y-4">
          <UAlert
            title="Kata sandi berhasil diubah."
            description="Silakan masuk kembali menggunakan kata sandi baru Anda."
            color="success"
            icon="i-lucide-circle-check"
            variant="subtle"
          />
          <UButton
            to="/login"
            label="Ke halaman masuk"
            class="w-full justify-center"
          />
        </div>
      </template>

      <template v-else-if="sessionReady">
        <UForm
          :schema="formStateSchema"
          :state="formState"
          class="space-y-4"
          @submit="handleSetPassword"
        >
          <UFormField label="Kata Sandi Baru" name="newPassword">
            <UInput
              id="newPassword"
              v-model="formState.newPassword"
              placeholder="••••••••"
              name="newPassword"
              type="password"
              class="w-full"
              required
            />
          </UFormField>

          <UFormField label="Konfirmasi Kata Sandi" name="confirmPassword">
            <UInput
              id="confirmPassword"
              v-model="formState.confirmPassword"
              placeholder="••••••••"
              name="confirmPassword"
              type="password"
              class="w-full"
              required
            />
          </UFormField>

          <div class="pt-4 flex justify-end gap-2">
            <UButton color="primary" type="submit" :loading="isLoading">
              Simpan Kata Sandi
            </UButton>
          </div>
        </UForm>
      </template>

      <template v-else>
        <div class="space-y-4">
          <div class="space-y-2">
            <USkeleton class="h-4 w-32" />
            <USkeleton class="h-9 w-full" />
          </div>
          <div class="space-y-2">
            <USkeleton class="h-4 w-44" />
            <USkeleton class="h-9 w-full" />
          </div>
          <div class="pt-4 flex justify-end">
            <USkeleton class="h-9 w-40" />
          </div>
        </div>
      </template>

      <template #footer>
        <UButton
          to="/login"
          variant="ghost"
          class="w-full justify-center"
          label="Kembali ke halaman masuk"
        />
      </template>
    </UCard>

    <div class="text-center">
      <UButton to="/" icon="i-lucide-arrow-left" variant="ghost">
        Kembali ke beranda
      </UButton>
    </div>
  </div>
</template>
