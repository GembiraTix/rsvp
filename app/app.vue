<script setup>
import { id } from '@nuxt/ui/locale'
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
</script>

<template>
  <UApp :locale="id">
    <UHeader>
      <template #left>
        <img src="/logo/gembiratix.svg" width="40" height="40" alt="" />
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

          <UButton v-if="user" to="/users" variant="ghost" color="neutral">
            Dasbor Saya
          </UButton>

          <UButton v-if="!user" to="/login" color="neutral"> Masuk </UButton>
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
          GembiraTix • ©
          {{ new Date().getFullYear() }}
        </p>
      </template>
    </UFooter>
  </UApp>
</template>
