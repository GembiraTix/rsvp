<script lang="ts" setup>
import type { Event } from '~~/server/domain/types'
interface Props {
  event: Event
}

const { event } = defineProps<Props>()
</script>

<template>
  <UCard
    class="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow duration-200"
    :ui="{ body: 'p-5 flex-1 flex flex-col justify-between' }"
  >
    <figure
      class="relative h-44 -mx-5 -mt-5 mb-4 overflow-hidden bg-surface-container"
    >
      <img
        v-if="event.image_url"
        :src="event.image_url"
        :alt="event.title || 'Event image'"
        class="w-full h-full object-cover"
      />
    </figure>

    <figcaption class="space-y-1.5 text-xs text-on-surface-variant mb-3">
      <h3 class="text-lg font-bold text-on-surface mb-2 line-clamp-2">
        {{ event.title }}
      </h3>

      <div v-if="event.starts_at" class="flex items-center gap-1.5">
        <UIcon name="i-lucide-calendar" class="w-4 h-4 text-primary" />
        <span>{{ formatDate(event.starts_at) }} WIB</span>
      </div>
    </figcaption>

    <p class="text-sm text-on-surface-variant line-clamp-3 mb-4">
      {{ event.description }}
    </p>

    <div class="pt-4 border-t border-outline flex items-center justify-between">
      <UButton
        :to="`/e/${event.slug}`"
        color="primary"
        variant="solid"
        class="w-full justify-center"
        trailing-icon="i-lucide-arrow-right"
      >
        Lihat & RSVP
      </UButton>
    </div>
  </UCard>
</template>
