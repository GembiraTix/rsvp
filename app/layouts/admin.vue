<template>
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
    </UDashboardSidebar>

    <section class="space-y-4 mx-auto px-12 py-12">
      <slot />
    </section>
  </UDashboardGroup>
</template>
