<script lang="ts" setup>
import type { Event } from '~~/server/domain/types'
import type { TableColumn } from '@nuxt/ui'

import { useUserProfile } from '@/composables/useUserProfile'

definePageMeta({
  middleware: 'auth',
})

const { fetchProfile } = useUserProfile()
const { data: profileRes } = await fetchProfile()
const profile = computed(() => profileRes.value?.data || null)

const { fetchAll } = useEvents()

const { data: organizedRes } = await fetchAll()
const organizedEvents = computed(() =>
  ['admin', 'super_admin'].includes(profile.value?.role ?? '')
    ? organizedRes.value?.data
    : [],
)

const eventsColumns: TableColumn<Event>[] = [
  {
    accessorKey: 'title',
    header: 'Judul Acara',
  },
  {
    accessorKey: 'starts_at',
    header: 'Tanggal',
    cell: ({ row }) =>
      row.original.starts_at ? formatDate(row.original.starts_at) : '-',
  },
  {
    accessorKey: 'ends_at',
    header: 'Tanggal akhir',
    cell: ({ row }) =>
      row.original.ends_at ? formatDate(row.original.ends_at) : '-',
  },
  {
    accessorKey: 'location',
    header: 'Lokasi',
    cell: ({ row }) => row.original.location || '-',
  },
  {
    id: 'action',
    header: 'Aksi',
  },
]
</script>

<template>
  <div class="space-y-4">
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
      <UTable :data="organizedEvents ?? []" :columns="eventsColumns">
        <template #action-cell="{ row }">
          <div class="flex gap-2 justify-end whitespace-nowrap">
            <UButton
              :to="`/e/${row.original.slug}/manage`"
              variant="soft"
              icon="i-lucide-settings"
            >
              Kelola
            </UButton>
            <UButton
              :to="`/e/${row.original.slug}`"
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-external-link"
              title="Lihat halaman publik"
            />
          </div>
        </template>

        <template #empty>
          <UEmpty
            icon="i-lucide-calendar-plus"
            title="Anda belum menggelar acara apa pun."
          >
            <template #actions>
              <UButton to="/admin/events/new" size="sm">
                Buat Acara Pertama Anda
              </UButton>
            </template>
          </UEmpty>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
