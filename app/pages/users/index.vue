<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'My Dashboard - FPCE Job Fair',
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

watch(
  user,
  () => {
    if (!user.value) return navigateTo('/login')
  },
  { immediate: true },
)

const { data: profile, refresh: refreshProfile } = await useAsyncData(
  `user-profile-${user.value?.sub}`,
  async () => {
    if (!user.value) return null
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.value.sub)
      .single()

    return data
  },
)

const isProfileModalOpen = ref(false)
const isUpdatingProfile = ref(false)
const profileErrorMessage = ref('')
const profileSuccessMessage = ref('')

const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
})

type ProfileFormState = z.output<typeof profileFormSchema>

const profileFormState = reactive<ProfileFormState>({
  name: '',
})

function openProfileModal() {
  profileFormState.name =
    profile.value?.name || user.value?.user_metadata?.full_name || ''
  profileErrorMessage.value = ''
  profileSuccessMessage.value = ''
  isProfileModalOpen.value = true
}

async function handleUpdateProfile(e: FormSubmitEvent<ProfileFormState>) {
  if (!user.value) return
  isUpdatingProfile.value = true
  profileErrorMessage.value = ''
  profileSuccessMessage.value = ''

  try {
    const { error } = await supabase
      .from('users')
      .update({
        email: user.value.email || '',
        name: e.data.name,
      })
      .eq('id', user.value.sub)

    if (error) {
      profileErrorMessage.value = error.message
      return
    }

    await refreshProfile()
    profileSuccessMessage.value = 'Profile updated successfully!'
    setTimeout(() => {
      isProfileModalOpen.value = false
    }, 1000)
  } catch (err: unknown) {
    if (err instanceof Error) {
      profileErrorMessage.value = err.message
    } else {
      profileErrorMessage.value = 'Failed to update profile.'
    }
  } finally {
    isUpdatingProfile.value = false
  }
}

// Fetch events organized by this user
const { data: organizedEvents, refresh: refreshOrganized } = await useAsyncData(
  `organized-events-${user.value?.id}`,
  async () => {
    if (!user.value) return []

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', user.value.sub)
      .order('starts_at', { ascending: true })

    if (error) throw error
    return data || []
  },
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
  },
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
    <UCard class="border-outline bg-surface-container/50">
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-full bg-primary/20 text-primary font-bold text-xl flex items-center justify-center shrink-0"
          >
            {{ (profile?.name || user?.email || 'U').charAt(0).toUpperCase() }}
          </div>
          <div>
            <h2 class="text-xl font-bold text-on-surface">
              {{ profile?.name || 'User Profile' }}
            </h2>
            <p class="text-sm text-on-surface-variant">
              {{ user?.email }}
            </p>
          </div>
        </div>

        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-user-cog"
          @click="openProfileModal"
        >
          Edit Profile
        </UButton>
      </div>
    </UCard>

    <!-- edit profile -->
    <UModal
      v-model:open="isProfileModalOpen"
      title="Edit Profile Settings"
      description="Update your display name and profile details."
    >
      <template #body>
        <div
          v-if="profileErrorMessage"
          class="mb-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2"
        >
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
          <span>{{ profileErrorMessage }}</span>
        </div>

        <div
          v-if="profileSuccessMessage"
          class="mb-4 p-3 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded-lg text-xs flex items-center gap-2"
        >
          <UIcon name="i-lucide-check-circle" class="w-4 h-4 shrink-0" />
          <span>{{ profileSuccessMessage }}</span>
        </div>

        <UForm
          :schema="profileFormSchema"
          :state="profileFormState"
          class="space-y-4"
          @submit="handleUpdateProfile"
        >
          <UFormField label="Email">
            <UInput :model-value="user?.email" disabled class="w-full" />
          </UFormField>

          <UFormField label="Full Name / Display Name" name="name">
            <UInput
              id="name"
              v-model="profileFormState.name"
              placeholder="e.g. Dr. Jane Doe"
              name="name"
              class="w-full"
            />
          </UFormField>

          <div class="pt-4 flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="isProfileModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton color="primary" type="submit" :loading="isUpdatingProfile">
              Save Changes
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
          <UIcon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
          Events You're Organizing ({{ organizedEvents?.length || 0 }})
        </h2>

        <div class="flex items-center gap-3">
          <UButton to="/users/events/new" color="primary" icon="i-lucide-plus">
            Create New Event
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
                  <span v-if="ev.starts_at">{{
                    formatDate(ev.starts_at)
                  }}</span>
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
          <UIcon
            name="i-lucide-calendar-plus"
            class="w-10 h-10 mx-auto text-on-surface-variant"
          />
          <p class="text-sm text-on-surface-variant">
            You haven't organized any events yet.
          </p>
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

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
          <UIcon name="i-lucide-ticket" class="w-5 h-5 text-primary" />
          Events You've Joined ({{ joinedRsvps?.length || 0 }})
        </h2>
      </div>

      <UCard class="border-outline" :ui="{ body: 'p-0 sm:p-0' }">
        <div
          v-if="joinedRsvps && joinedRsvps.length > 0"
          class="overflow-x-auto"
        >
          <table class="w-full text-left text-sm">
            <thead
              class="bg-surface-container border-b border-outline text-xs font-semibold text-on-surface-variant uppercase"
            >
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
          <UIcon
            name="i-lucide-ticket-slash"
            class="w-10 h-10 mx-auto text-on-surface-variant"
          />
          <p class="text-sm text-on-surface-variant">
            You haven't joined any events yet.
          </p>
          <UButton to="/" color="neutral" variant="outline" size="sm">
            Explore Public Events
          </UButton>
        </div>
      </UCard>
    </section>
  </div>
</template>
