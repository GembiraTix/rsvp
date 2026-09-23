<script setup>
import { useSiteName } from '@/composables/useSiteName'
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'id',
  },
})

const siteName = useSiteName()
const title = `${siteName} - RSVP Acara`
const description = `Portal RSVP untuk ${siteName}`

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()

async function handleLogout() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="flex items-center gap-2 font-bold text-on-surface text-base hover:opacity-90 transition-opacity"
        >
          <span>{{ useSiteName() }}</span>
        </NuxtLink>
      </template>

      <template #right>
        <div class="flex items-center gap-2">
          <UButton to="/" variant="ghost" color="neutral"> Acara </UButton>

          <UButton v-if="user" to="/users" variant="ghost" color="neutral"> Dasbor Saya </UButton>

          <UButton v-if="!user" to="/login" color="neutral"> Masuk </UButton>

          <UButton
            v-else
            variant="ghost"
            color="error"
            icon="i-lucide-log-out"
            @click="handleLogout"
          >
            Keluar
          </UButton>

          <UColorModeButton size="sm" />
        </div>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-xs text-on-surface-variant">
          Pusat Karir Fakultas & Penyelenggara Bursa Kerja • ©
          {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <span v-if="user" class="text-xs text-on-surface-variant">
          Masuk sebagai {{ user.email }}
        </span>
      </template>
    </UFooter>
  </UApp>
</template>
