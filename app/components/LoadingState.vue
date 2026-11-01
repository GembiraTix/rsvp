<script setup lang="ts">
defineProps<{ label?: string }>()
</script>

<template>
  <div
    class="p-8 flex flex-col items-center justify-center gap-3 text-on-surface-variant"
  >
    <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin" />
    <p v-if="label" class="text-sm">{{ label }}</p>
  </div>
</template>
