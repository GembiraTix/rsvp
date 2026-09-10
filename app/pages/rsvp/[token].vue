<script setup lang="ts">
const route = useRoute()
const token = computed(() => route.params.token as string)

// Mock reservation details
const rsvp = ref({
  token: token.value,
  name: 'Alex Munthe',
  email: 'alex@example.com',
  note: 'Looking forward to meeting recruiters from civil and environmental engineering firms.',
  createdAt: '2026-08-26 14:00',
  status: 'Confirmed',
  event: {
    id: '1',
    title: 'FPCE Career Fair 2026 - Main Exhibition',
    date: '2026-09-15',
    time: '09:00 - 16:00',
    location: 'Faculty Main Hall & Auditorium',
  },
})

useSeoMeta({
  title: 'Manage RSVP - FPCE Job Fair',
})

const isCancelling = ref(false)
const isCancelled = ref(false)

function handleCancelRsvp() {
  if (!confirm('Are you sure you want to cancel your RSVP reservation?')) return
  isCancelling.value = true
  setTimeout(() => {
    isCancelling.value = false
    isCancelled.value = true
    rsvp.value.status = 'Cancelled'
  }, 600)
}
</script>

<template>
  <div class="py-12 max-w-xl mx-auto px-4 space-y-6">
    <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-arrow-left">
      Back to Home
    </UButton>

    <UCard class="border-neutral-200 dark:border-neutral-800 shadow-md">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-neutral-900 dark:text-white">
              Reservation Details
            </h1>
            <p class="text-xs text-neutral-500 font-mono">Ref: {{ token }}</p>
          </div>

          <UBadge
            :color="rsvp.status === 'Confirmed' ? 'primary' : 'neutral'"
            variant="subtle"
            size="md"
          >
            {{ rsvp.status }}
          </UBadge>
        </div>
      </template>

      <div class="space-y-6">
        <!-- Event Summary -->
        <div
          class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-2"
        >
          <p class="text-xs font-semibold text-primary uppercase tracking-wide">
            Event Information
          </p>
          <h2 class="font-bold text-neutral-900 dark:text-white">
            {{ rsvp.event.title }}
          </h2>
          <div class="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
            <p>📅 {{ rsvp.event.date }} ({{ rsvp.event.time }})</p>
            <p>📍 {{ rsvp.event.location }}</p>
          </div>
        </div>

        <!-- Guest Details -->
        <div class="space-y-3 text-sm">
          <div>
            <span class="text-xs text-neutral-500 block">Attendee Name</span>
            <span class="font-medium text-neutral-900 dark:text-white">{{
              rsvp.name
            }}</span>
          </div>
          <div>
            <span class="text-xs text-neutral-500 block">Email</span>
            <span class="font-medium text-neutral-900 dark:text-white">{{
              rsvp.email
            }}</span>
          </div>
          <div v-if="rsvp.note">
            <span class="text-xs text-neutral-500 block">Note / Interests</span>
            <p class="text-neutral-700 dark:text-neutral-300 text-xs mt-0.5">
              {{ rsvp.note }}
            </p>
          </div>
        </div>

        <!-- Cancellation Section -->
        <div
          v-if="rsvp.status === 'Confirmed'"
          class="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3"
        >
          <p class="text-xs text-neutral-500">
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
