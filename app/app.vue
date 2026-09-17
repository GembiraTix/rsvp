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
          <span>FPCE Job Fair</span>
        </NuxtLink>
      </template>

      <template #right>
        <div class="flex items-center gap-2">
          <UButton to="/" variant="ghost" color="neutral"> Events </UButton>

          <UButton v-if="user" to="/users" variant="ghost" color="neutral"> My Dashboard </UButton>

          <UButton v-if="!user" to="/login" color="neutral"> Log in </UButton>

          <UButton
            v-else
            variant="ghost"
            color="error"
            icon="i-lucide-log-out"
            @click="handleLogout"
          >
            Sign Out
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
          Faculty Career Center & Job Fair Organizer • ©
          {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <span v-if="user" class="text-xs text-on-surface-variant">
          Signed in as {{ user.email }}
        </span>
      </template>
    </UFooter>
  </UApp>
</template>
