<script setup>
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'en',
  },
})

const title = 'FPCE Job Fair - Event RSVP'
const description = 'RSVP portal for FPCE Faculty Job Fair'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="flex items-center gap-2 font-bold text-neutral-900 dark:text-white text-base hover:opacity-90 transition-opacity"
        >
          <span>FPCE Job Fair</span>
        </NuxtLink>
      </template>

      <template #right>
        <div class="flex items-center gap-2">
          <UButton to="/" variant="ghost" color="neutral" size="sm">
            Events
          </UButton>

          <UButton
            to="/admin"
            variant="outline"
            color="neutral"
            size="sm"
            icon="i-lucide-shield"
          >
            Admin
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
        <p class="text-xs text-neutral-500">
          Faculty Career Center & Job Fair Organizer • ©
          {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <NuxtLink
          to="/admin/login"
          class="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
        >
          Admin Login
        </NuxtLink>
      </template>
    </UFooter>
  </UApp>
</template>
