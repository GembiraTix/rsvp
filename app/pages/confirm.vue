<script lang="ts" setup>
useSeoMeta({
  title: `Konfirmasi Sesi - GembiraTix`,
})

const user = useSupabaseUser()
const route = useRoute()

const VERIFY_TIMEOUT_MS = 10_000

const isTimedOut = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  timer = setTimeout(() => {
    if (!user.value) {
      isTimedOut.value = true
    }
  }, VERIFY_TIMEOUT_MS)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

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
    <template v-if="isTimedOut">
      <div
        class="w-12 h-12 rounded-full bg-error/20 text-error flex items-center justify-center"
      >
        <UIcon name="i-lucide-circle-x" class="w-6 h-6" />
      </div>
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-on-surface">Verifikasi gagal</h2>
        <p class="text-sm text-on-surface-variant max-w-md">
          Sesi Anda tidak dapat dikonfirmasi. Tautan verifikasi mungkin sudah
          kedaluwarsa. Silakan masuk kembali atau daftar ulang untuk menerima
          email verifikasi baru.
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          :to="`/login?redirectTo=${route.query.redirectTo ?? '/users'}`"
          color="primary"
          icon="i-lucide-log-in"
          label="Masuk"
        />
        <UButton
          to="/signup"
          color="neutral"
          variant="outline"
          label="Daftar"
        />
      </div>
    </template>

    <template v-else>
      <div
        class="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center animate-pulse"
      >
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin" />
      </div>
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-on-surface">
          Memverifikasi Autentikasi...
        </h2>
        <p class="text-sm text-on-surface-variant">
          Mohon tunggu sebentar selagi sesi Anda sedang dikonfirmasi.
        </p>
      </div>
    </template>
  </div>
</template>
