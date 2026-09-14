<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useUrlSearchParams } from '@vueuse/core'

useSeoMeta({
  title: 'Sign In / Sign Up - FPCE Job Fair Admin',
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
      errorMessage.value = 'An unexpected error occurred during sign in.'
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
        'Account created! Please check your email to confirm your registration.'
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'An unexpected error occurred during sign up.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col justify-center max-w-md mx-auto gap-6 py-12 px-4">
    <header class="text-center space-y-1">
      <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
        {{ isSignUp ? 'Create Account' : 'Welcome Back' }}
      </h1>
      <p class="text-sm text-neutral-500">
        {{
          isSignUp ? 'Sign up for a new account' : 'Get back to your account'
        }}
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

      <div
        v-if="successMessage"
        class="mb-4 p-3 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded-lg text-xs flex items-center gap-2"
      >
        <UIcon name="i-lucide-check-circle" class="w-4 h-4 shrink-0" />
        <span>{{ successMessage }}</span>
      </div>

      <UForm
        :schema="formStateSchema"
        :state="formState"
        class="space-y-4"
        @submit="handleSubmit"
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
          :label="isSignUp ? 'Sign Up' : 'Sign In'"
          type="submit"
          size="lg"
          class="w-full justify-center"
          :loading="isLoading"
        />
      </UForm>

      <div
        class="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-center"
      >
        <button
          type="button"
          class="text-xs text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors cursor-pointer"
          @click="toggleMode"
        >
          {{
            isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"
          }}
        </button>
      </div>
    </UCard>

    <div class="text-center">
      <UButton to="/" icon="i-lucide-arrow-left" variant="ghost">
        Back to home
      </UButton>
    </div>
  </div>
</template>
