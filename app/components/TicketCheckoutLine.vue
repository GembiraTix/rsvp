<script lang="ts" setup>
interface Props {
  line: SelectedCartLine
}

const { line } = defineProps<Props>()
</script>

<template>
  <li class="p-4 flex items-start justify-between gap-4">
    <div>
      <p class="font-medium text-on-surface">
        {{ line.ticketType.name }}
      </p>
      <p class="text-sm text-on-surface-variant">
        {{ line.qty }} × {{ formatRupiah(line.ticketType.price) }}
      </p>
    </div>
    <p class="font-mono text-on-surface">
      {{ formatRupiah(line.total) }}
    </p>
  </li>
</template>
