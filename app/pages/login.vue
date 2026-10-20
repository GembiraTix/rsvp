<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { StateMachine } from '~/utils/statemachine'

useSeoMeta({
  title: 'Masuk / Daftar - Admin Bursa Kerja FPCE',
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

type AuthState = 'login' | 'signup' | 'waiting_confirmation' | 'confirmed'
const currentAuthState = ref<AuthState>('login')
const authStateFlow: Record<AuthState, AuthState[]> = {
  signup: [
    'login',
    'waiting_confirmation',
    'confirmed' /* only possible if confirmation email is turned off */,
  ],
  login: ['signup', 'confirmed'],
  waiting_confirmation: ['confirmed'],
  confirmed: [],
}

const authStateMachine = new StateMachine<AuthState>('login', authStateFlow)

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

const isLoading = ref(false)
const errorMessage = ref('')

function toggleForms() {
  const newMode = currentAuthState.value === 'signup' ? 'login' : 'signup'
  currentAuthState.value = newMode
  authStateMachine.advance(currentAuthState.value)

  errorMessage.value = ''
}

async function handleSubmit(e: FormSubmitEvent<FormState>) {
  if (currentAuthState.value === 'signup') {
    await handleSignUp(e)
  } else {
    await handleLogin(e)
  }
}

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

const url = useRequestURL()
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

async function handleResendConfirmation() {
  isLoading.value = true

  // should we wrap this in a try?
  // nah i'd win
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

  isLoading.value = false
}
</script>

<template>
  <div class="flex flex-col justify-center max-w-xl mx-auto gap-6 py-12 px-4">
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
          <h1 class="text-2xl font-bold text-on-surface">
            {{
              currentAuthState === 'signup'
                ? 'Buat Akun'
                : 'Selamat Datang Kembali'
            }}
          </h1>
          <p class="text-on-surface-variant">
            {{
              currentAuthState === 'signup'
                ? 'Daftar untuk membuat akun baru'
                : 'Masuk kembali ke akun Anda'
            }}
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

      <UForm
        :schema="formStateSchema"
        :state="formState"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField
          v-show="currentAuthState === 'signup'"
          label="Nama lengkap"
          name="name"
        >
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
          :label="currentAuthState === 'signup' ? 'Daftar' : 'Masuk'"
          type="submit"
          size="lg"
          class="w-full justify-center"
          :loading="isLoading"
        />
      </UForm>

      <template #footer>
        <UButton
          @click="toggleForms"
          variant="ghost"
          class="w-full justify-center"
          :label="
            currentAuthState === 'signup'
              ? 'Sudah punya akun? Masuk'
              : 'Belum punya akun? Daftar'
          "
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
