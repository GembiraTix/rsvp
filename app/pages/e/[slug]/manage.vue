<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const eventSlug = computed(() => route.params.slug as string)

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Fetch event details
const { data: event, error: eventError } = await useAsyncData(
  `event-manage-${eventSlug.value}`,
  async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', eventSlug.value)
      .single()

    if (error) throw error
    return data
  },
)

if (eventError.value) {
  throw createError({ statusCode: 404, statusMessage: 'Event not found' })
}

// Check authorization (Must be event creator)
const isCreator = computed(
  () => user.value && event.value && event.value.created_by === user.value.sub,
)

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
  title: () => (event.value ? `Manage ${event.value.title}` : 'Manage Event'),
  description: () =>
    `Event management and attendee list for ${event.value?.title || 'event'}`,
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
  const headers = [
    'ID',
    'Name',
    'Email',
    'Organization',
    'RSVP Date',
    'Attending',
  ]
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
  link.setAttribute('download', `attendees-${event.value.slug}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function removeAttendee(id: number) {
  if (!confirm('Remove this attendee from RSVP list?')) return
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
      Back to Dashboard
    </UButton>

    <!-- Unauthorized Banner -->
    <div
      v-if="!isCreator"
      class="p-6 text-center rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 space-y-3"
    >
      <UIcon name="i-lucide-shield-alert" class="w-10 h-10 mx-auto" />
      <h2 class="text-xl font-bold">Unauthorized Access</h2>
      <p class="text-sm">
        You are not authorized to manage this event because you are not the
        creator.
      </p>
      <UButton
        :to="`/e/${eventSlug}`"
        color="neutral"
        variant="outline"
        size="sm"
      >
        View Public Event Page
      </UButton>
    </div>

    <!-- Authorized Manager View -->
    <template v-else-if="event">
      <!-- Event Header Card -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
      >
        <div>
          <UBadge color="primary" variant="subtle" size="sm" class="mb-1">
            Event Management
          </UBadge>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
            {{ event.title }}
          </h1>
          <p class="text-xs text-neutral-500 mt-1">
            <span v-if="event.starts_at"
              >📅 {{ formatDate(event.starts_at) }} •
            </span>
            <span>📍 {{ event.location || 'No location set' }}</span>
          </p>
        </div>

        <div class="flex items-center gap-3">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-download"
            @click="exportCSV"
          >
            Export CSV
          </UButton>
          <UButton
            :to="`/e/${event.slug}`"
            color="primary"
            variant="soft"
            icon="i-lucide-external-link"
          >
            Public Page
          </UButton>
        </div>
      </div>

      <!-- Attendees Table Card -->
      <UCard
        class="border-neutral-200 dark:border-neutral-800"
        :ui="{ body: 'p-0 sm:p-0' }"
      >
        <template #header>
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
                Registered Attendees ({{ attendees?.length || 0 }})
              </h2>
            </div>
            <div class="w-full sm:w-72">
              <UInput
                v-model="attendeeSearch"
                placeholder="Search by name, email, organization..."
                icon="i-lucide-search"
                size="sm"
                class="w-full"
              />
            </div>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead
              class="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 uppercase"
            >
              <tr>
                <th class="px-6 py-3">Attendee Name</th>
                <th class="px-6 py-3">Email</th>
                <th class="px-6 py-3">Organization / Note</th>
                <th class="px-6 py-3">Status</th>
                <th class="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
              <tr
                v-for="att in filteredAttendees"
                :key="att.id"
                class="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20"
              >
                <td
                  class="px-6 py-4 font-medium text-neutral-900 dark:text-white"
                >
                  {{ att.name }}
                </td>
                <td
                  class="px-6 py-4 text-neutral-600 dark:text-neutral-300 font-mono text-xs"
                >
                  {{ att.email || '-' }}
                </td>
                <td
                  class="px-6 py-4 text-neutral-600 dark:text-neutral-300 max-w-xs truncate"
                >
                  {{ att.organization || '-' }}
                </td>
                <td class="px-6 py-4">
                  <UBadge
                    :color="att.is_attending ? 'primary' : 'neutral'"
                    variant="subtle"
                  >
                    {{ att.is_attending ? 'Confirmed' : 'Cancelled' }}
                  </UBadge>
                </td>
                <td class="px-6 py-4 text-right">
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    title="Remove attendee"
                    @click="removeAttendee(att.id)"
                  />
                </td>
              </tr>
              <tr v-if="filteredAttendees.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-neutral-500">
                  No attendees found matching search criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </template>
  </div>
</template>
