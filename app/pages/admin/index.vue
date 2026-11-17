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

const { fetchAll, restoreEvent } = useEvents()

const { data: organizedRes, refresh } = await fetchAll({ withDeleted: true })
const organizedEvents = computed(() =>
  ['admin', 'super_admin'].includes(profile.value?.role ?? '')
    ? organizedRes.value?.data
    : [],
)

const isSuperAdmin = computed(() => profile.value?.role === 'super_admin')
const isRestoringId = ref<number | null>(null)
const errorMessage = ref('')
const toast = useToast()

async function handleRestore(id: number) {
  isRestoringId.value = id
  errorMessage.value = ''
  try {
    await restoreEvent(id)
    await refresh()
    toast.add({
      title: 'Acara berhasil dipulihkan.',
      color: 'success',
      icon: 'i-lucide-circle-check',
    })
  } catch {
    errorMessage.value = 'Gagal memulihkan acara.'
  } finally {
    isRestoringId.value = null
  }
}

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
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      if (row.original.deleted_at) return 'Dihapus'
      if (row.original.is_draft) return 'Draf'
      return 'Aktif'
    },
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

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="errorMessage"
    />

    <UCard class="border-outline" :ui="{ body: 'p-0 sm:p-0' }">
      <UTable :data="organizedEvents ?? []" :columns="eventsColumns">
        <template #status-cell="{ row }">
          <UBadge
            v-if="row.original.deleted_at"
            color="error"
            variant="subtle"
          >
            Dihapus
          </UBadge>
          <UBadge
            v-else-if="row.original.is_draft"
            color="warning"
            variant="subtle"
          >
            Draf
          </UBadge>
          <UBadge v-else color="success" variant="subtle">Aktif</UBadge>
        </template>

        <template #action-cell="{ row }">
          <div class="flex gap-2 justify-end whitespace-nowrap">
            <UButton
              v-if="row.original.deleted_at && isSuperAdmin"
              variant="soft"
              color="warning"
              icon="i-lucide-archive-restore"
              :loading="isRestoringId === row.original.id"
              :disabled="isRestoringId !== null"
              @click="handleRestore(row.original.id)"
            >
              Pulihkan
            </UButton>
            <template v-else-if="!row.original.deleted_at">
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
            </template>
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
