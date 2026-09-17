<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Create New Event - FPCE Job Fair',
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const form = reactive({
  title: '',
  date: '',
  time: '',
  location: '',
  description: '',
  image: '',
})

const isSubmitting = ref(false)
const errorMessage = ref('')

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function handleCreate() {
  if (!form.title || !form.date || !form.location || !user.value?.id) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const slug = `${slugify(form.title)}-${Math.floor(1000 + Math.random() * 9000)}`
    const startsAt = form.time ? `${form.date}T${form.time}:00Z` : `${form.date}T00:00:00Z`

    const { data, error } = await supabase
      .from('events')
      .insert({
        title: form.title,
        slug,
        location: form.location,
        description: form.description || null,
        image_url: form.image || null,
        starts_at: startsAt,
        created_by: user.value.id,
      })
      .select('slug')
      .single()

    if (error) {
      errorMessage.value = error.message
      return
    }

    if (data?.slug) {
      await navigateTo(`/e/${data.slug}/manage`)
    } else {
      await navigateTo('/users')
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Failed to create event. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="py-8 max-w-3xl mx-auto px-4 space-y-6">
    <UButton
      to="/users"
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
    >
      Back to Dashboard
    </UButton>

    <UCard class="border-outline shadow-md">
      <template #header>
        <div>
          <h1 class="text-2xl font-bold text-on-surface">
            Create Job Fair Event / Session
          </h1>
          <p class="text-xs text-on-surface-variant">
            Fill in the details to publish a new session for attendee RSVPs
          </p>
        </div>
      </template>

      <form @submit.prevent="handleCreate" class="space-y-4">
        <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-on-surface-variant">
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
            <label class="text-xs font-semibold text-on-surface-variant">
              Date <span class="text-red-500">*</span>
            </label>
            <UInput v-model="form.date" type="date" required class="w-full" />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-on-surface-variant">
              Start Time
            </label>
            <UInput
              v-model="form.time"
              type="time"
              class="w-full"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-on-surface-variant">
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
          <label class="text-xs font-semibold text-on-surface-variant">
            Banner Image URL
          </label>
          <UInput
            v-model="form.image"
            placeholder="https://images.unsplash.com/photo-..."
            class="w-full"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-on-surface-variant">
            Description
          </label>
          <UTextarea
            v-model="form.description"
            :rows="4"
            placeholder="Details about requirements, agenda, eligibility, and speakers..."
            class="w-full"
          />
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-outline">
          <UButton to="/users" variant="ghost" color="neutral">
            Cancel
          </UButton>
          <UButton type="submit" color="primary" :loading="isSubmitting">
            Publish Event
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
