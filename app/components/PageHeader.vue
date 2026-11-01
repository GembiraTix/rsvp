<script setup lang="ts">
defineProps<{
  title?: string | null
  description?: string | null
  backTo?: string
  backLabel?: string
}>()
</script>

<template>
  <div class="space-y-2">
    <UButton
      v-if="backTo"
      :to="backTo"
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
    >
      {{ backLabel || 'Kembali' }}
    </UButton>

    <div
      v-if="title || description || $slots.actions"
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 v-if="title" class="text-3xl font-bold text-on-surface">
          {{ title }}
        </h1>
        <p v-if="description" class="text-on-surface-variant">
          {{ description }}
        </p>
      </div>

      <div v-if="$slots.actions" class="flex items-center gap-3">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
