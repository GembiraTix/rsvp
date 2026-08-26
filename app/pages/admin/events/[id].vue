<script setup lang="ts">
const route = useRoute()
const eventId = computed(() => route.params.id as string)

useSeoMeta({
  title: 'Event Attendees & Analytics - Admin',
})

const event = ref({
  id: eventId.value,
  title: 'FPCE Career Fair 2026 - Main Exhibition',
  date: '2026-09-15',
  time: '09:00 - 16:00',
  location: 'Faculty Main Hall & Auditorium',
})

const attendees = ref([
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@university.edu',
    note: 'Final year Civil Engineering student',
    rsvpDate: '2026-08-25 10:15',
    status: 'Confirmed',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'janesmith@university.edu',
    note: 'Interested in structural engineering roles',
    rsvpDate: '2026-08-25 11:30',
    status: 'Confirmed',
  },
  {
    id: '3',
    name: 'Robert Tan',
    email: 'robert.tan@alumni.edu',
    note: 'Alumni looking for mid-level opportunities',
    rsvpDate: '2026-08-25 14:02',
    status: 'Confirmed',
  },
  {
    id: '4',
    name: 'Siti Rahma',
    email: 'siti.rahma@university.edu',
    note: '',
    rsvpDate: '2026-08-26 09:10',
    status: 'Confirmed',
  },
])

const attendeeSearch = ref('')

const filteredAttendees = computed(() => {
  if (!attendeeSearch.value.trim()) return attendees.value
  const q = attendeeSearch.value.toLowerCase()
  return attendees.value.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.note.toLowerCase().includes(q),
  )
})

function exportCSV() {
  const headers = ['ID', 'Name', 'Email', 'Note', 'RSVP Date', 'Status']
  const rows = attendees.value.map((a) => [
    a.id,
    `"${a.name}"`,
    `"${a.email}"`,
    `"${a.note}"`,
    `"${a.rsvpDate}"`,
    `"${a.status}"`,
  ])
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `rsvp-attendees-event-${eventId.value}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function removeAttendee(id: string) {
  if (!confirm('Remove this attendee from RSVP list?')) return
  attendees.value = attendees.value.filter((a) => a.id !== id)
}
</script>

<template>
  <div class="py-8 max-w-6xl mx-auto px-4 space-y-6">
    <UButton
      to="/admin"
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
    >
      Back to Dashboard
    </UButton>

    <!-- Event Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
    >
      <div>
        Attendees for
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
          {{ event.title }}
        </h1>
        <p class="text-xs text-neutral-500 mt-1">
          {{ event.date }} ({{ event.time }}) • {{ event.location }}
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
          :to="`/events/${eventId}`"
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
              Registered Attendees ({{ attendees.length }})
            </h2>
          </div>
          <div class="w-full sm:w-72">
            <UInput
              v-model="attendeeSearch"
              placeholder="Search by name, email, note..."
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
              <th class="px-6 py-3">Attendee</th>
              <th class="px-6 py-3">Email</th>
              <th class="px-6 py-3">Notes / Background</th>
              <th class="px-6 py-3">RSVP Time</th>
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
                {{ att.email }}
              </td>
              <td
                class="px-6 py-4 text-neutral-600 dark:text-neutral-300 max-w-xs truncate"
              >
                {{ att.note || '-' }}
              </td>
              <td class="px-6 py-4 text-neutral-500 text-xs">
                {{ att.rsvpDate }}
              </td>
              <td class="px-6 py-4">
                <UBadge color="primary" variant="subtle">
                  {{ att.status }}
                </UBadge>
              </td>
              <td class="px-6 py-4 text-right">
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  @click="removeAttendee(att.id)"
                />
              </td>
            </tr>
            <tr v-if="filteredAttendees.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-neutral-500">
                No attendees found matching search criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
