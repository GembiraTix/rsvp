<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useUrlSearchParams } from '@vueuse/core'

useSeoMeta({
  title: 'Masuk / Daftar - Admin Bursa Kerja FPCE',
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()

const params = useUrlSearchParams<{ mode?: string }>('history')
const isSignUp = computed(() => params.mode === 'signup')

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
  name: z.string().nonempty(),
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
const successMessage = ref('')

function toggleMode() {
  params.mode = isSignUp.value ? 'login' : 'signup'
  errorMessage.value = ''
  successMessage.value = ''
}

async function handleSubmit(e: FormSubmitEvent<FormState>) {
  if (isSignUp.value) {
    await handleSignUp(e)
  } else {
    await handleLogin(e)
  }
}

async function handleLogin(e: FormSubmitEvent<FormState>) {
  errorMessage.value = ''
  successMessage.value = ''
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

async function handleSignUp(e: FormSubmitEvent<FormState>) {
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    const url = useRequestURL()
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
      await navigateTo(redirectPath)
    } else {
      successMessage.value =
        'Akun berhasil dibuat! Silakan periksa email Anda untuk mengonfirmasi pendaftaran.'
    }
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
</script>

<template>
  <div class="flex flex-col justify-center max-w-md mx-auto gap-6 py-12 px-4">
    <header class="text-center space-y-1">
      <h1 class="text-3xl font-bold text-on-surface">
        {{ isSignUp ? 'Buat Akun' : 'Selamat Datang Kembali' }}
      </h1>
      <p class="text-sm text-on-surface-variant">
        {{
          isSignUp
            ? 'Daftar untuk membuat akun baru'
            : 'Masuk kembali ke akun Anda'
        }}
      </p>
    </header>

    <UCard class="border-outline shadow-md">
      <UAlert
        v-if="errorMessage"
        title="Ada kesalahan!"
        :description="errorMessage"
        color="error"
        icon="i-lucide-triangle-alert"
        variant="subtle"
      />

      <UAlert
        v-if="successMessage"
        title="Akun berhasil dibuat!"
        :description="successMessage"
        color="success"
        variant="subtle"
      />

      <UForm
        :schema="formStateSchema"
        :state="formState"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField v-show="isSignUp" label="Nama lengkap" name="name">
          <UInput
            id="name"
            v-model="formState.name"
            placeholder="Andi Johan"
            name="name"
            type="text"
            class="w-full"
            required
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
          :label="isSignUp ? 'Daftar' : 'Masuk'"
          type="submit"
          size="lg"
          class="w-full justify-center"
          :loading="isLoading"
        />
      </UForm>

      <template #footer>
        <UButton
          @click="toggleMode"
          variant="ghost"
          class="w-full justify-center"
          :label="
            isSignUp ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'
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
