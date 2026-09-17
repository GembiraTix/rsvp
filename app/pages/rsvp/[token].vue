<script setup lang="ts">
const route = useRoute()
const token = computed(() => route.params.token as string)

const supabase = useSupabaseClient()

const {
  data: rsvp,
  error,
  refresh,
} = await useAsyncData(`rsvp-${token.value}`, async () => {
  const { data, error: fetchError } = await supabase
    .from('rsvps')
    .select(
      'id, name, email, organization, token, is_attending, created_at, events (id, title, location, starts_at, ends_at)',
    )
    .eq('token', token.value)
    .single()

  if (fetchError) throw fetchError
  return data
})

useSeoMeta({
  title: 'Manage RSVP - FPCE Job Fair',
})

const isCancelling = ref(false)
const errorMessage = ref('')

async function handleCancelRsvp() {
  if (!confirm('Are you sure you want to cancel your RSVP reservation?')) return
  isCancelling.value = true
  errorMessage.value = ''

  try {
    const { error: updateError } = await supabase
      .from('rsvps')
      .update({ is_attending: false })
      .eq('token', token.value)

    if (updateError) {
      errorMessage.value = updateError.message
      return
    }

    await refresh()
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Failed to cancel reservation.'
    }
  } finally {
    isCancelling.value = false
  }
}
</script>

<template>
  <div class="py-12 max-w-xl mx-auto px-4 space-y-6">
    <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-arrow-left">
      Back to Home
    </UButton>

    <div
      v-if="error || !rsvp"
      class="p-6 text-center rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
    >
      <UIcon name="i-lucide-alert-circle" class="w-8 h-8 mx-auto mb-2" />
      <h2 class="text-lg font-bold">Reservation Not Found</h2>
      <p class="text-xs text-on-surface-variant mt-1">
        Please check your reservation link and try again.
      </p>
    </div>

    <UCard v-else class="border-outline shadow-md">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-on-surface">
              Reservation Details
            </h1>
            <p class="text-xs text-on-surface-variant font-mono">Ref: {{ token }}</p>
          </div>

          <UBadge
            :color="rsvp.is_attending ? 'primary' : 'neutral'"
            variant="subtle"
            size="md"
          >
            {{ rsvp.is_attending ? 'Confirmed' : 'Cancelled' }}
          </UBadge>
        </div>
      </template>

      <div class="space-y-6">
        <div
          v-if="errorMessage"
          class="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg text-xs"
        >
          {{ errorMessage }}
        </div>

        <!-- Event Summary -->
        <div
          v-if="rsvp.events"
          class="p-4 rounded-xl bg-surface-container border border-outline space-y-2"
        >
          <p class="text-xs font-semibold text-primary uppercase tracking-wide">
            Event Information
          </p>
          <h2 class="font-bold text-on-surface">
            {{ rsvp.events.title }}
          </h2>
          <div class="text-xs text-on-surface-variant space-y-1">
            <p v-if="rsvp.events.starts_at">
              📅 {{ formatDate(rsvp.events.starts_at) }}
            </p>
            <p v-if="rsvp.events.location">📍 {{ rsvp.events.location }}</p>
          </div>
        </div>

        <!-- Guest Details -->
        <div class="space-y-3 text-sm">
          <div>
            <span class="text-xs text-on-surface-variant block">Attendee Name</span>
            <span class="font-medium text-on-surface">{{
              rsvp.name
            }}</span>
          </div>
          <div>
            <span class="text-xs text-on-surface-variant block">Email</span>
            <span class="font-medium text-on-surface">{{
              rsvp.email
            }}</span>
          </div>
          <div v-if="rsvp.organization">
            <span class="text-xs text-on-surface-variant block"
              >Organization / Background</span
            >
            <p
              class="text-on-surface-variant text-xs mt-0.5 whitespace-pre-line"
            >
              {{ rsvp.organization }}
            </p>
          </div>
        </div>

        <div
          v-if="rsvp.is_attending"
          class="pt-4 border-t border-outline space-y-3"
        >
          <p class="text-xs text-on-surface-variant">
            Cannot make it? You can cancel your RSVP so organizers know the
            actual headcount.
          </p>
          <UButton
            color="error"
            variant="soft"
            class="w-full justify-center"
            :loading="isCancelling"
            @click="handleCancelRsvp"
          >
            Cancel My RSVP
          </UButton>
        </div>

        <div
          v-else
          class="p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-lg text-sm text-center"
        >
          This reservation has been cancelled.
        </div>
      </div>
    </UCard>
  </div>
</template>
