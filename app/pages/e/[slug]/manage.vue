<script setup lang="ts">
import { useEvents } from '@/composables/useEvents'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const eventSlug = computed(() => route.params.slug as string)

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const { fetchBySlug } = useEvents()
const { data: eventRes, error: eventError } = await fetchBySlug(eventSlug)

if (eventError.value || !eventRes.value?.data) {
  throw createError({ statusCode: 404, statusMessage: 'Acara tidak ditemukan' })
}

const event = computed(() => eventRes.value!.data)

// Check authorization (Must be event creator)
const isCreator = computed(
  () =>
    user.value &&
    event.value &&
    event.value.created_by === (user.value.sub || user.value.id),
)

if (!isCreator) {
  navigateTo('/')
}

// Fetch attendees roster
const { data: attendees, refresh: refreshAttendees } = await useAsyncData(
  `event-attendees-${event.value?.id}`,
  async () => {
    if (!event.value?.id) return []
    const { data, error } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', event.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },
)

useSeoMeta({
  title: () => (event.value ? `Kelola ${event.value.title}` : 'Kelola Acara'),
  description: () =>
    `Pengelolaan acara dan daftar peserta untuk ${event.value?.title || 'acara'}`,
})

const attendeeSearch = ref('')

const filteredAttendees = computed(() => {
  if (!attendees.value) return []
  if (!attendeeSearch.value.trim()) return attendees.value
  const q = attendeeSearch.value.toLowerCase()
  return attendees.value.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.organization && a.organization.toLowerCase().includes(q)),
  )
})

function exportCSV() {
  if (!attendees.value || !event.value) return
  const headers = ['ID', 'Nama', 'Email', 'Organisasi', 'Tanggal RSVP', 'Hadir']
  const rows = attendees.value.map((a) => [
    a.id,
    `"${a.name}"`,
    `"${a.email || ''}"`,
    `"${a.organization || ''}"`,
    `"${a.created_at}"`,
    `"${a.is_attending}"`,
  ])
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `peserta-${event.value.slug}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function removeAttendee(id: number) {
  if (!confirm('Hapus peserta ini dari daftar RSVP?')) return
  const { error } = await supabase.from('rsvps').delete().eq('id', id)
  if (!error) {
    await refreshAttendees()
  }
}
</script>

<template>
  <div class="py-8 max-w-6xl mx-auto px-4 space-y-6">
    <UButton
      to="/users"
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
    >
      Kembali ke Dasbor
    </UButton>

    <template v-if="event">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-surface-container border border-outline"
      >
        <div>
          <h1 class="text-2xl font-bold text-on-surface mb-2">
            {{ event.title }}
          </h1>
          <time
            class="text-on-surface-variant"
            :datetime="event.starts_at"
            v-if="event.starts_at"
          >
            {{ formatDate(event.starts_at) }}
          </time>
          <p class="text-on-surface-variant">
            {{ event.location || 'Lokasi belum diatur' }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-download"
            @click="exportCSV"
          >
            Ekspor CSV
          </UButton>
          <UButton
            :to="`/e/${event.slug}`"
            color="primary"
            variant="soft"
            icon="i-lucide-external-link"
          >
            Halaman Publik
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-pencil"
            :to="`/e/${event.slug}/edit`"
          >
            Edit Acara
          </UButton>
        </div>
      </div>

      <UCard class="border-outline" :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <h2 class="text-lg font-bold text-on-surface">
                Peserta Terdaftar ({{ attendees?.length || 0 }})
              </h2>
            </div>
            <div class="w-full sm:w-72">
              <UInput
                v-model="attendeeSearch"
                placeholder="Cari berdasarkan nama, email, organisasi..."
                icon="i-lucide-search"
                size="sm"
                class="w-full"
              />
            </div>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead
              class="bg-surface-container border-b border-outline text-xs font-semibold text-on-surface-variant uppercase"
            >
              <tr>
                <th class="px-6 py-3">Nama Peserta</th>
                <th class="px-6 py-3">Email</th>
                <th class="px-6 py-3">Organisasi / Catatan</th>
                <th class="px-6 py-3">Status</th>
                <th class="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline">
              <tr
                v-for="att in filteredAttendees"
                :key="att.id"
                class="hover:bg-surface-container/50"
              >
                <td class="px-6 py-4 font-medium text-on-surface">
                  {{ att.name }}
                </td>
                <td class="px-6 py-4 text-on-surface-variant font-mono text-xs">
                  {{ att.email || '-' }}
                </td>
                <td class="px-6 py-4 text-on-surface-variant max-w-xs truncate">
                  {{ att.organization || '-' }}
                </td>
                <td class="px-6 py-4">
                  <UBadge
                    :color="att.is_attending ? 'primary' : 'neutral'"
                    variant="subtle"
                  >
                    {{ att.is_attending ? 'Terkonfirmasi' : 'Dibatalkan' }}
                  </UBadge>
                </td>
                <td class="px-6 py-4 text-right">
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    title="Hapus peserta"
                    @click="removeAttendee(att.id)"
                  />
                </td>
              </tr>
              <tr v-if="filteredAttendees.length === 0">
                <td
                  colspan="5"
                  class="px-6 py-8 text-center text-on-surface-variant"
                >
                  Tidak ada peserta yang cocok dengan kriteria pencarian.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </template>
  </div>
</template>
