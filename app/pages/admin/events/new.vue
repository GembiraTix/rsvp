<script setup lang="ts">
useSeoMeta({
  title: 'Create New Event - Admin'
})

const router = useRouter()

const form = reactive({
  title: '',
  date: '',
  time: '',
  location: '',
  speaker: '',
  description: '',
  image: ''
})

const isSubmitting = ref(false)

function handleCreate() {
  if (!form.title || !form.date || !form.location) return

  isSubmitting.value = true
  setTimeout(() => {
    isSubmitting.value = false
    router.push('/admin')
  }, 600)
}
</script>

<template>
  <div class="py-8 max-w-3xl mx-auto px-4 space-y-6">
    <UButton
      to="/admin"
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
    >
      Back to Dashboard
    </UButton>

    <UCard class="border-neutral-200 dark:border-neutral-800 shadow-md">
      <template #header>
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
            Create Job Fair Event / Session
          </h1>
          <p class="text-xs text-neutral-500">
            Fill in the details to publish a new session for attendee RSVPs
          </p>
        </div>
      </template>

      <form @submit.prevent="handleCreate" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Event Title <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="form.title"
            placeholder="e.g. Civil Engineering Career Talk by PT Wijaya Karya"
            required
            class="w-full"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Date <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="form.date"
              type="date"
              required
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Time Range <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="form.time"
              placeholder="e.g. 10:00 - 12:00"
              required
              class="w-full"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Location / Room <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="form.location"
              placeholder="e.g. Main Auditorium / Room 204"
              required
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Speaker / Presenting Organization
            </label>
            <UInput
              v-model="form.speaker"
              placeholder="e.g. PT Astra International / Career Center"
              class="w-full"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Banner Image URL
          </label>
          <UInput
            v-model="form.image"
            placeholder="https://example.com/banner.jpg"
            class="w-full"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Description
          </label>
          <UTextarea
            v-model="form.description"
            :rows="4"
            placeholder="Details about requirements, agenda, eligibility, and speakers..."
            class="w-full"
          />
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800">
          <UButton
            to="/admin"
            variant="ghost"
            color="neutral"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="isSubmitting"
          >
            Publish Event
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
