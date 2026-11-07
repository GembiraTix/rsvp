<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

useSeoMeta({
  title: 'Daftar - GembiraTix',
})

definePageMeta({
  layout: 'auth',
})

const supabase = useSupabaseClient()

const formStateSchema = z.object({
  name: z.string().optional(),
  email: z.email('Masukkan alamat email yang valid.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
})

type FormState = z.output<typeof formStateSchema>

const formState = reactive<FormState>({
  name: '',
  email: '',
  password: '',
})

type AuthState = 'signup' | 'waiting_confirmation' | 'confirmed'
const currentAuthState = ref<AuthState>('signup')
const authStateFlow: Record<AuthState, AuthState[]> = {
  signup: [
    'waiting_confirmation',
    'confirmed' /* only possible if confirmation email is turned off */,
  ],
  waiting_confirmation: ['confirmed'],
  confirmed: [],
}

const authStateMachine = new StateMachine<AuthState>('signup', authStateFlow)

const isLoading = ref(false)
const errorMessage = ref('')

async function handleSignUp(e: FormSubmitEvent<FormState>) {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const { data, error } = await supabase.auth.signUp({
      email: e.data.email,
      password: e.data.password,
      options: {
        data: {
          name: formState.name,
          role: 'user',
        },
        emailRedirectTo: `${url.origin}/confirm`,
      },
    })

    if (error) {
      errorMessage.value = error.message
      return
    }

    if (data.session) {
      const redirectPath = (route.query.redirectTo as string) || '/'
      return await navigateTo(redirectPath)
    }

    currentAuthState.value = 'waiting_confirmation'
    authStateMachine.advance(currentAuthState.value)
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Terjadi kesalahan saat mendaftar.'
    }
  } finally {
    isLoading.value = false
  }
}

const url = useRequestURL()
const route = useRoute()

async function handleResendConfirmation() {
  isLoading.value = true

  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: formState.email,
      options: {
        emailRedirectTo: `${url.origin}/confirm`,
      },
    })

    if (error) {
      errorMessage.value = error.message
      return
    }

    if (data.session) {
      const redirectPath = (route.query.redirectTo as string) || '/'
      return await navigateTo(redirectPath)
    }
  } catch (error: unknown) {
    // TODO: change this to alert
    errorMessage.value =
      // @ts-expect-error we dont' know the type pls I don't have the time for this
      error.message ??
      'ada kesalahan saat mendaftar. Silahkan coba lagi dalam beberapa saat.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header
      v-if="currentAuthState === 'waiting_confirmation'"
      class="text-center space-y-1 bg-surface-container px-16 py-12 rounded-md"
    >
      <h1 class="text-3xl font-bold text-on-surface">Akun berhasil dibuat!</h1>
      <p class="text-on-surface mt-2">
        Silahkan cek email anda. Jika tidak ada di inbox, cek spam ya
      </p>

      <div class="my-4 space-y-2">
        <p class="text-on-surface-variant">Tidak mendapatkan email?</p>

        <UButton
          @click="handleResendConfirmation"
          size="lg"
          variant="outline"
          label="kirimkan ulang email konfirmasi"
        />
      </div>
    </header>

    <UCard v-else class="border-outline shadow-md">
      <template #header>
        <div class="text-center space-y-1">
          <h1 class="text-2xl font-bold text-on-surface">Buat Akun</h1>
          <p class="text-on-surface-variant">Daftar untuk membuat akun baru</p>
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
        @submit="handleSignUp"
      >
        <UFormField label="Nama lengkap" name="name">
          <UInput
            id="name"
            v-model="formState.name"
            placeholder="Andi Johan"
            name="name"
            type="text"
            class="w-full"
          />
        </UFormField>
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
          label="Daftar"
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
          label="Sudah punya akun? Masuk"
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
