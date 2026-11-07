<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

useSeoMeta({
  title: 'Masuk - GembiraTix',
})

definePageMeta({
  layout: 'auth',
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()

watch(
  user,
  () => {
    if (user.value) {
      const redirectPath = (route.query.redirectTo as string) || '/users'
      return navigateTo(redirectPath)
    }
  },
  { immediate: true },
)

const formStateSchema = z.object({
  email: z.email('Masukkan alamat email yang valid.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
})

type FormState = z.output<typeof formStateSchema>

const formState = reactive<FormState>({
  email: '',
  password: '',
})

const isLoading = ref(false)
const errorMessage = ref('')

async function handleLogin(e: FormSubmitEvent<FormState>) {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: e.data.email,
      password: e.data.password,
    })

    if (error) {
      errorMessage.value = error.message
      return
    }

    const redirectPath = (route.query.redirectTo as string) || '/'
    await navigateTo(redirectPath)
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Terjadi kesalahan saat masuk.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UCard class="border-outline shadow-md">
    <template #header>
      <div class="text-center space-y-1">
        <h1 class="text-2xl font-bold text-on-surface">
          Selamat Datang Kembali
        </h1>
        <p class="text-on-surface-variant">Masuk kembali ke akun Anda</p>
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
      @submit="handleLogin"
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

      <UFormField label="Kata Sandi" name="password">
        <UInput
          id="password"
          v-model="formState.password"
          placeholder="••••••••"
          name="password"
          type="password"
          class="w-full"
          required
        />
      </UFormField>

      <UButton
        label="Masuk"
        type="submit"
        size="lg"
        class="w-full justify-center"
        :loading="isLoading"
      />
    </UForm>

    <template #footer>
      <UButton
        to="/signup"
        variant="ghost"
        class="w-full justify-center"
        label="Belum punya akun? Daftar"
      />
    </template>
  </UCard>

  <div class="text-center">
    <UButton to="/" icon="i-lucide-arrow-left" variant="ghost">
      Kembali ke beranda
    </UButton>
  </div>
</template>
