<script setup lang="ts">
useSeoMeta({
  title: 'Admin Login - FPCE Job Fair'
})

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const router = useRouter()

function handleLogin() {
  errorMessage.value = ''
  isLoading.value = true

  // Scaffold simulation
  setTimeout(() => {
    isLoading.value = false
    if (email.value && password.value) {
      router.push('/admin')
    } else {
      errorMessage.value = 'Please provide both email and password.'
    }
  }, 600)
}
</script>

<template>
  <div class="min-h-[75vh] flex items-center justify-center px-4">
    <UCard class="w-full max-w-md shadow-xl border-neutral-200 dark:border-neutral-800">
      <template #header>
        <div class="text-center space-y-1">
          <UBadge color="neutral" variant="subtle" size="sm">
            Organizer Portal
          </UBadge>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
            Admin Sign In
          </h1>
          <p class="text-xs text-neutral-500">
            Sign in to manage faculty events, sessions, and RSVPs
          </p>
        </div>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg text-xs">
          {{ errorMessage }}
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Email Address</label>
          <UInput
            v-model="email"
            type="email"
            placeholder="admin@university.edu"
            required
            class="w-full"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Password</label>
          <UInput
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            class="w-full"
          />
        </div>

        <UButton
          type="submit"
          color="primary"
          class="w-full justify-center"
          size="lg"
          :loading="isLoading"
        >
          Sign In
        </UButton>
      </form>

      <template #footer>
        <div class="text-center">
          <NuxtLink to="/" class="text-xs text-neutral-500 hover:text-primary transition-colors">
            ← Back to Public Event Directory
          </NuxtLink>
        </div>
      </template>
    </UCard>
  </div>
</template>
