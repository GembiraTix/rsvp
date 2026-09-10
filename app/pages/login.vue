<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

useSeoMeta({
  title: 'Sign In - FPCE Job Fair Admin',
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()

watch(
  user,
  () => {
    if (user.value) {
      const redirectPath = (route.query.redirectTo as string) || '/admin'
      return navigateTo(redirectPath)
    }
  },
  { immediate: true },
)

const formStateSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
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

    const redirectPath = (route.query.redirectTo as string) || '/admin'
    await navigateTo(redirectPath)
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'An unexpected error occurred during sign in.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col justify-center max-w-md mx-auto gap-6 py-12 px-4">
    <header class="text-center space-y-1">
      <UBadge color="primary" variant="subtle" size="sm" class="rounded-full">
        Organizer Portal
      </UBadge>
      <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
        Welcome Back
      </h1>
      <p class="text-sm text-neutral-500">
        Sign in to manage faculty events, sessions, and RSVPs
      </p>
    </header>

    <UCard class="border-neutral-200 dark:border-neutral-800 shadow-md">
      <div
        v-if="errorMessage"
        class="mb-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2"
      >
        <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

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
            placeholder="admin@university.edu"
            name="email"
            type="email"
            class="w-full"
            required
          />
        </UFormField>

        <UFormField label="Password" name="password">
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
          label="Sign In"
          type="submit"
          size="lg"
          class="w-full justify-center"
          :loading="isLoading"
        />
      </UForm>
    </UCard>

    <div class="text-center">
      <NuxtLink
        to="/"
        class="text-xs text-neutral-500 hover:text-primary transition-colors"
      >
        ← Back to Public Event Directory
      </NuxtLink>
    </div>
  </div>
</template>
