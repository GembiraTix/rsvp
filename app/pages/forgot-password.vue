<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

useSeoMeta({
  title: 'Lupa Kata Sandi - GembiraTix',
})

definePageMeta({
  layout: 'auth',
})

const supabase = useSupabaseClient()
const url = useRequestURL()
const toast = useToast()

const formStateSchema = z.object({
  email: z.email('Masukkan alamat email yang valid.'),
})

type FormState = z.output<typeof formStateSchema>

const formState = reactive<FormState>({
  email: '',
})

const isLoading = ref(false)
const errorMessage = ref('')

async function handleResetPassword(e: FormSubmitEvent<FormState>) {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      e.data.email,
      {
        redirectTo: `${url.origin}/login`,
      },
    )

    if (error) {
      errorMessage.value = error.message
      return
    }

    toast.add({
      title: 'Email reset kata sandi telah dikirim.',
      description:
        'Silakan periksa inbox email Anda untuk mengatur ulang kata sandi.',
      color: 'success',
      icon: 'i-lucide-circle-check',
    })

    formState.email = ''
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Terjadi kesalahan saat mengirimkan email reset kata sandi.'
    }
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
          <h1 class="text-2xl font-bold text-on-surface">Lupa Kata Sandi</h1>
          <p class="text-on-surface-variant">Masukkan alamat email akun Anda</p>
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

      <UForm
        :schema="formStateSchema"
        :state="formState"
        class="space-y-4"
        @submit="handleResetPassword"
      >
        <UFormField label="Email" name="email">
          <UInput
            id="email"
            v-model="formState.email"
            placeholder="andi@johan.com"
            name="email"
            type="email"
            class="w-full"
            required
          />
        </UFormField>

        <UButton
          label="Kirimkan email reset"
          type="submit"
          size="lg"
          class="w-full justify-center"
          :loading="isLoading"
        />
      </UForm>

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
