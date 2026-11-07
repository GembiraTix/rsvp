<script lang="ts" setup>
definePageMeta({
  middleware: 'auth',
  layout: 'admin',
})

import { useUserProfile } from '@/composables/useUserProfile'

const { fetchProfile } = useUserProfile()
const { data: profileRes } = await fetchProfile()
const profile = computed(() => profileRes.value?.data || null)

const { fetchAll } = useEvents()

const { data: organizedRes } = await fetchAll()
const organizedEvents = computed(() =>
  ['admin', 'super_admin'].includes(profile.value?.role!)
    ? organizedRes.value?.data
    : [],
)
</script>

<template>
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
      Acara Anda ({{ organizedEvents?.length || 0 }})
    </h2>

    <div class="flex items-center gap-3">
      <UButton to="/admin/events/new" color="primary" icon="i-lucide-plus">
        Buat Acara Baru
      </UButton>
    </div>
  </div>

  <UCard class="border-outline" :ui="{ body: 'p-0 sm:p-0' }">
    <div
      v-if="organizedEvents && organizedEvents.length > 0"
      class="overflow-x-auto"
    >
      <table class="w-full text-left">
        <thead
          class="bg-surface-container border-b border-outline text-xs font-semibold text-on-surface-variant uppercase"
        >
          <tr>
            <th class="px-6 py-3">Judul Acara</th>
            <th class="px-6 py-3">Tanggal</th>
            <th class="px-6 py-3">Lokasi</th>
            <th class="px-6 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline">
          <tr
            v-for="ev in organizedEvents"
            :key="ev.id"
            class="hover:bg-surface-container/50"
          >
            <td class="px-6 py-4 font-medium text-on-surface">
              {{ ev.title }}
            </td>
            <td class="px-6 py-4 text-on-surface-variant">
              <span v-if="ev.starts_at">{{ formatDate(ev.starts_at) }}</span>
              <span v-else>-</span>
            </td>
            <td class="px-6 py-4 text-on-surface-variant">
              {{ ev.location || '-' }}
            </td>
            <td class="px-6 py-4 text-right space-x-2">
              <UButton
                :to="`/e/${ev.slug}/manage`"
                variant="soft"
                icon="i-lucide-settings"
              >
                Kelola
              </UButton>
              <UButton
                :to="`/e/${ev.slug}`"
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-external-link"
                title="Lihat halaman publik"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="p-8 text-center space-y-3">
      <UIcon
        name="i-lucide-calendar-plus"
        class="w-10 h-10 mx-auto text-on-surface-variant"
      />
      <p class="text-sm text-on-surface-variant">
        Anda belum menggelar acara apa pun.
      </p>
      <UButton
        to="/users/events/new"
        color="primary"
        variant="outline"
        size="sm"
      >
        Buat Acara Pertama Anda
      </UButton>
    </div>
  </UCard>
</template>
