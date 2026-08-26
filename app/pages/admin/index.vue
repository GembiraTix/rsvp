<script setup lang="ts">
useSeoMeta({
  title: 'Admin Dashboard - FPCE Job Fair',
})

// Mock events data for admin
const events = ref([
  {
    id: '1',
    title: 'FPCE Career Fair 2026 - Main Exhibition',
    date: '2026-09-15',
    location: 'Faculty Main Hall',
    rsvpCount: 142,
    status: 'Published',
  },
])

const totalRsvps = computed(() =>
  events.value.reduce((acc, curr) => acc + curr.rsvpCount, 0),
)

function deleteEvent(id: string) {
  if (!confirm('Are you sure you want to delete this event?')) return
  events.value = events.value.filter((e) => e.id !== id)
}
</script>

<template>
  <div class="py-8 max-w-6xl mx-auto px-4 space-y-8">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
          Events Dashboard
        </h1>
      </div>

      <div class="flex items-center gap-3">
        <UButton to="/admin/events/new" color="primary" icon="i-lucide-plus">
          Create New Event
        </UButton>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UCard class="border-neutral-200 dark:border-neutral-800">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-xl">
            <UIcon name="i-lucide-calendar" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs text-neutral-500 font-medium">Total Sessions</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-white">
              {{ events.length }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="border-neutral-200 dark:border-neutral-800">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-xl">
            <UIcon name="i-lucide-users" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs text-neutral-500 font-medium">Total RSVPs</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-white">
              {{ totalRsvps }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard class="border-neutral-200 dark:border-neutral-800">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-xl">
            <UIcon name="i-lucide-check-circle" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs text-neutral-500 font-medium">Status</p>
            <p class="text-2xl font-bold text-neutral-900 dark:text-white">
              Active
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Events List Table -->
    <UCard
      class="border-neutral-200 dark:border-neutral-800"
      :ui="{ body: 'p-0 sm:p-0' }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
            Job Fair Events & Sessions
          </h2>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead
            class="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 uppercase"
          >
            <tr>
              <th class="px-6 py-3">Event Title</th>
              <th class="px-6 py-3">Date</th>
              <th class="px-6 py-3">Location</th>
              <th class="px-6 py-3">RSVP Count</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
            <tr
              v-for="ev in events"
              :key="ev.id"
              class="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20"
            >
              <td
                class="px-6 py-4 font-medium text-neutral-900 dark:text-white"
              >
                {{ ev.title }}
              </td>
              <td class="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                {{ ev.date }}
              </td>
              <td class="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                {{ ev.location }}
              </td>
              <td class="px-6 py-4">
                {{ ev.rsvpCount }}
              </td>
              <td class="px-6 py-4 text-right space-x-2">
                <UButton
                  :to="`/admin/events/${ev.id}`"
                  size="xs"
                  color="neutral"
                  variant="outline"
                  title="show attendees"
                >
                  Attendees
                </UButton>
                <UButton
                  :to="`/events/${ev.id}`"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-external-link"
                  title="show public event page"
                />
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  title="delete event"
                  @click="deleteEvent(ev.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
