<script setup lang="ts">
import { id } from '@nuxt/ui/locale'
import type { NavigationMenuItem } from '@nuxt/ui'

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'id',
  },
})

const title = `RSVP Acara - GembiraTix`
const description = `Portal RSVP untuk GembiraTix`

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
    <UHeader title="GembiraTix">
      <template #left>
        <img src="/logo/gembiratix.svg" width="40" height="40" alt="" />
        <NuxtLink
          to="/"
          class="flex items-center gap-2 font-bold text-on-surface text-base hover:opacity-90 transition-opacity"
        >
          <span>GembiraTix</span>
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
      <slot />
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
