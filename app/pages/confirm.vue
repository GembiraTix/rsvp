<script lang="ts" setup>
useSeoMeta({
  title: 'Confirming Session - FPCE Job Fair',
})

const user = useSupabaseUser()
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
</script>

<template>
  <div
    class="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-4"
  >
    <div
      class="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center animate-pulse"
    >
      <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin" />
    </div>
    <div class="space-y-1">
      <h2 class="text-xl font-bold text-on-surface">
        Verifying Authentication...
      </h2>
      <p class="text-sm text-on-surface-variant">
        Please wait while your session is being confirmed.
      </p>
    </div>
  </div>
</template>
