<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'My Dashboard - FPCE Job Fair'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

watch(
  user,
  () => {
    if (!user.value) return navigateTo('/login')
  },
  { immediate: true }
)

// Fetch events organized by this user
const { data: organizedEvents, refresh: refreshOrganized } = await useAsyncData(
  `organized-events-${user.value?.id}`,
  async () => {
    if (!user.value?.id) return []
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', user.value.id)
      .order('starts_at', { ascending: true })

    if (error) throw error
    return data || []
  }
)

// Fetch RSVPs joined by this user
const { data: joinedRsvps, refresh: refreshJoined } = await useAsyncData(
  `joined-rsvps-${user.value?.email}`,
  async () => {
    if (!user.value?.email) return []
    const { data, error } = await supabase
      .from('rsvps')
      .select('id, token, is_attending, created_at, events (*)')
      .eq('email', user.value.email)
      .eq('is_attending', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
)

async function deleteEvent(id: number) {
  if (!confirm('Are you sure you want to delete this event?')) return
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (!error) {
    await refreshOrganized()
    await refreshJoined()
  }
}
</script>

<template>
  <div class="py-8 max-w-6xl mx-auto px-4 space-y-10">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-on-surface">
          My Dashboard
        </h1>
        <p class="text-sm text-on-surface-variant">
          Manage your organized events and view your registered sessions
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          to="/users/events/new"
          color="primary"
          icon="i-lucide-plus"
        >
          Create New Event
        </UButton>
      </div>
    </div>

    <!-- Section 1: Events You're Organizing -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
          <UIcon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
          Events You're Organizing ({{ organizedEvents?.length || 0 }})
        </h2>
      </div>

      <UCard
        class="border-outline"
        :ui="{ body: 'p-0 sm:p-0' }"
      >
        <div v-if="organizedEvents && organizedEvents.length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-surface-container border-b border-outline text-xs font-semibold text-on-surface-variant uppercase">
              <tr>
                <th class="px-6 py-3">Event Title</th>
                <th class="px-6 py-3">Date</th>
                <th class="px-6 py-3">Location</th>
                <th class="px-6 py-3 text-right">Actions</th>
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
                    size="xs"
                    color="primary"
                    variant="soft"
                    icon="i-lucide-settings"
                  >
                    Manage
                  </UButton>
                  <UButton
                    :to="`/e/${ev.slug}`"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-external-link"
                    title="View public page"
                  />
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    title="Delete event"
                    @click="deleteEvent(ev.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="p-8 text-center space-y-3">
          <UIcon name="i-lucide-calendar-plus" class="w-10 h-10 mx-auto text-on-surface-variant" />
          <p class="text-sm text-on-surface-variant">You haven't organized any events yet.</p>
          <UButton
            to="/users/events/new"
            color="primary"
            variant="outline"
            size="sm"
          >
            Create Your First Event
          </UButton>
        </div>
      </UCard>
    </section>

    <!-- Section 2: Events You've Joined -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
          <UIcon name="i-lucide-ticket" class="w-5 h-5 text-primary" />
          Events You've Joined ({{ joinedRsvps?.length || 0 }})
        </h2>
      </div>

      <UCard
        class="border-outline"
        :ui="{ body: 'p-0 sm:p-0' }"
      >
        <div v-if="joinedRsvps && joinedRsvps.length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-surface-container border-b border-outline text-xs font-semibold text-on-surface-variant uppercase">
              <tr>
                <th class="px-6 py-3">Event</th>
                <th class="px-6 py-3">Location</th>
                <th class="px-6 py-3">RSVP Ref</th>
                <th class="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline">
              <tr
                v-for="rsvp in joinedRsvps"
                :key="rsvp.id"
                class="hover:bg-surface-container/50"
              >
                <td class="px-6 py-4 font-medium text-on-surface">
                  {{ rsvp.events?.title || 'Event' }}
                </td>
                <td class="px-6 py-4 text-on-surface-variant">
                  {{ rsvp.events?.location || '-' }}
                </td>
                <td class="px-6 py-4 text-xs font-mono text-on-surface-variant">
                  {{ rsvp.token.slice(0, 8) }}...
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                  <UButton
                    :to="`/rsvp/${rsvp.token}`"
                    size="xs"
                    color="neutral"
                    variant="outline"
                  >
                    View Ticket
                  </UButton>
                  <UButton
                    v-if="rsvp.events?.slug"
                    :to="`/e/${rsvp.events.slug}`"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-external-link"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="p-8 text-center space-y-3">
          <UIcon name="i-lucide-ticket-slash" class="w-10 h-10 mx-auto text-on-surface-variant" />
          <p class="text-sm text-on-surface-variant">You haven't joined any events yet.</p>
          <UButton
            to="/"
            color="neutral"
            variant="outline"
            size="sm"
          >
            Explore Public Events
          </UButton>
        </div>
      </UCard>
    </section>
  </div>
</template>
