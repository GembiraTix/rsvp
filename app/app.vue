<script setup lang="ts">
import { id } from '@nuxt/ui/locale'
import { useSiteName } from '@/composables/useSiteName'
import { ref } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'

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
const navItems: NavigationMenuItem[] = [
  {
    label: 'Beranda',
    to: '/',
  },
  {
    label: 'Dasbor',
    to: '/users',
  },
]

if (!user.value) {
  navItems.push({
    label: 'Masuk',
    to: '/login',
    type: 'link',
  })
}
</script>

<template>
  <UApp :locale="id">
    <UHeader :title="useSiteName()">
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
        <UNavigationMenu
          orientation="horizontal"
          class="max-sm:hidden"
          :items="navItems"
        />
      </template>

      <template #body>
        <UNavigationMenu orientation="vertical" :items="navItems" />
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
