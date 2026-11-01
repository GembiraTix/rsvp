<script setup lang="ts">
import type { Event } from '~~/server/domain/types'

defineProps<{ event: Event }>()
</script>

<template>
  <div class="space-y-1">
    <p
      v-if="event.starts_at"
      class="flex items-center gap-2 text-sm text-on-surface-variant"
    >
      <UIcon name="i-lucide-calendar" class="size-4 shrink-0" />
      <time :datetime="event.starts_at">{{ formatDate(event.starts_at) }}</time>
    </p>
    <p class="flex items-center gap-2 text-sm text-on-surface-variant">
      <UIcon name="i-lucide-map-pin" class="size-4 shrink-0" />
      {{ event.location || 'Lokasi belum diatur' }}
    </p>
  </div>
</template>
