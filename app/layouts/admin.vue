<script lang="ts" setup>
import { id } from '@nuxt/ui/locale'
import type { NavigationMenuItem } from '@nuxt/ui/runtime/components/NavigationMenu.vue.js'

const navItems: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    to: '/admin/',
  },
  {
    label: 'User management',
    to: '/admin/users',
  },
]
</script>

<template>
  <UApp :locale="id">
    <UDashboardGroup>
      <UDashboardSidebar>
        <template #header>
          <img src="/logo/gembiratix.svg" width="40" height="40" alt="" />
          <NuxtLink
            to="/"
            class="flex items-center gap-2 font-bold text-on-surface text-base hover:opacity-90 transition-opacity"
          >
            <span>GembiraTix</span>
          </NuxtLink>
        </template>

        <template #default>
          <UNavigationMenu orientation="vertical" :items="navItems" />
        </template>
      </UDashboardSidebar>

      <UDashboardPanel>
        <template #header>
          <UDashboardNavbar>
            <template #left>
              <UNavigationMenu :items="[{ label: 'Beranda', to: '/' }]" />
            </template>
          </UDashboardNavbar>
        </template>

        <template #body>
          <section class="max-w-6xl mx-auto w-full space-y-4">
            <slot />
          </section>
        </template>
      </UDashboardPanel>
    </UDashboardGroup>
  </UApp>
</template>
