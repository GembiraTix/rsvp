<script setup lang="ts">
const route = useRoute()
const eventId = computed(() => route.params.id as string)

// Mock event details for initial setup
const event = ref({
  id: eventId.value,
  title: 'FPCE Career Fair 2026 - Main Exhibition',
  date: '2026-09-15',
  time: '09:00 - 16:00',
  location: 'Faculty Main Hall & Auditorium',
  speaker: 'Faculty Career Center & Industry Partners',
  description: 'Connect with over 40+ leading engineering and tech companies. Open for all faculty students and alumni. Bring copies of your resume/CV and prepare for on-site inquiries and networking sessions.',
  image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
  rsvpCount: 142
})

useSeoMeta({
  title: () => `${event.value.title} - RSVP`,
  description: () => event.value.description
})

// RSVP Form State
const form = reactive({
  name: '',
  email: '',
  note: ''
})

const isSubmitting = ref(false)
const rsvpSuccess = ref(false)
const rsvpToken = ref('')

function handleRsvp() {
  if (!form.name || !form.email) return

  isSubmitting.value = true
  // Simulate submission
  setTimeout(() => {
    isSubmitting.value = false
    rsvpToken.value = 'rsvp-' + Math.random().toString(36).substring(2, 10)
    rsvpSuccess.value = true
  }, 600)
}
</script>

<template>
  <div class="py-8 max-w-5xl mx-auto px-4 space-y-8">
    <UButton
      to="/"
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
    >
      Back to all events
    </UButton>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Event Info (Left Column) -->
      <div class="lg:col-span-7 space-y-6">
        <div class="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 h-64 md:h-80">
          <img
            :src="event.image"
            :alt="event.title"
            class="w-full h-full object-cover"
          >
        </div>

        <div class="space-y-4">
          <UBadge color="primary" variant="subtle" size="md">
            Faculty Job Fair
          </UBadge>
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
            {{ event.title }}
          </h1>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm">
            <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
              <UIcon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
              <span>{{ event.date }} • {{ event.time }}</span>
            </div>
            <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
              <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-primary" />
              <span>{{ event.location }}</span>
            </div>
            <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
              <UIcon name="i-lucide-user" class="w-5 h-5 text-primary" />
              <span>{{ event.speaker }}</span>
            </div>
            <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
              <UIcon name="i-lucide-users" class="w-5 h-5 text-primary" />
              <span>{{ event.rsvpCount }} confirmed guests</span>
            </div>
          </div>

          <div class="space-y-2">
            <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
              About This Session
            </h2>
            <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
              {{ event.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- RSVP Form Card (Right Column) -->
      <div class="lg:col-span-5">
        <UCard
          class="sticky top-20 shadow-xl border-neutral-200 dark:border-neutral-800"
          :ui="{ body: 'p-6 space-y-6' }"
        >
          <!-- Success State -->
          <div v-if="rsvpSuccess" class="space-y-4 text-center py-4">
            <div class="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto">
              <UIcon name="i-lucide-check" class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold text-neutral-900 dark:text-white">
              RSVP Confirmed!
            </h3>
            <p class="text-sm text-neutral-600 dark:text-neutral-300">
              Thank you, <strong>{{ form.name }}</strong>! We have saved your spot.
            </p>

            <div class="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-left text-xs text-neutral-500 space-y-1">
              <p class="font-semibold text-neutral-700 dark:text-neutral-300">Manage your reservation:</p>
              <p>Need to cancel or review your RSVP? Save this direct link:</p>
              <NuxtLink
                :to="`/rsvp/${rsvpToken}`"
                class="text-primary hover:underline font-mono break-all inline-block pt-1"
              >
                /rsvp/{{ rsvpToken }}
              </NuxtLink>
            </div>

            <div class="pt-2 flex flex-col gap-2">
              <UButton
                :to="`/rsvp/${rsvpToken}`"
                color="neutral"
                variant="outline"
                class="w-full justify-center"
              >
                View / Manage My RSVP
              </UButton>
              <UButton
                to="/"
                color="primary"
                variant="ghost"
                class="w-full justify-center"
              >
                Browse Other Events
              </UButton>
            </div>
          </div>

          <!-- Form State -->
          <div v-else class="space-y-5">
            <div>
              <h3 class="text-xl font-bold text-neutral-900 dark:text-white">
                Reserve Your Spot
              </h3>
              <p class="text-xs text-neutral-500 mt-0.5">
                No account required. Fast and free registration.
              </p>
            </div>

            <form @submit.prevent="handleRsvp" class="space-y-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Full Name <span class="text-red-500">*</span>
                </label>
                <UInput
                  v-model="form.name"
                  placeholder="e.g. Jane Doe"
                  required
                  class="w-full"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Email Address <span class="text-red-500">*</span>
                </label>
                <UInput
                  v-model="form.email"
                  type="email"
                  placeholder="name@university.edu"
                  required
                  class="w-full"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Notes / Major / Company Interest <span class="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <UTextarea
                  v-model="form.note"
                  placeholder="e.g. 4th year Computer Science student interested in Software Engineering internships."
                  :rows="3"
                  class="w-full"
                />
              </div>

              <UButton
                type="submit"
                color="primary"
                size="lg"
                class="w-full justify-center"
                :loading="isSubmitting"
              >
                Confirm RSVP
              </UButton>
            </form>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
