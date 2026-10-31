<script lang="ts" setup>
import type { TicketType } from '~~/server/domain/types'

const ticketQty = defineModel<number>({ default: 0 })

interface Props {
  line: CartLine
}

const { line } = defineProps<Props>()
const e = defineEmits<{
  (e: 'select' | 'remove', ticketId: TicketType['id']): void
}>()
</script>

<template>
  <UCard>
    <div class="flex flex-col sm:flex-row sm:items-start gap-4">
      <div class="flex-1 space-y-1">
        <div class="flex items-center gap-2">
          <h2 class="text-lg text-on-surface">
            {{ line.ticketType.name }}
          </h2>
        </div>

        <p
          v-if="line.ticketType.description"
          class="text-sm text-on-surface-variant"
        >
          {{ line.ticketType.description }}
        </p>

        <p class="text-lg text-on-surface font-bold">
          {{ formatRupiah(line.ticketType.price) }}
        </p>
      </div>

      <div class="sm:w-64 shrink-0">
        <UButton
          v-if="line.qty <= 0"
          color="primary"
          variant="soft"
          block
          label="Pilih"
          icon="i-lucide-add"
          @click="e('select', line.ticketType.id)"
        />

        <div v-else class="flex items-center justify-between gap-2">
          <UInputNumber
            :model-value="ticketQty"
            :min="line.ticketType.min_qty"
            :max="line.ticketType.max_qty"
            size="md"
            :ui="{
              decrement: 'p-0',
              increment: 'p-0',
            }"
          >
            <template #decrement>
              <UButton
                icon="i-lucide-minus"
                title="kurangi tiket"
                size="md"
                variant="ghost"
                @click="ticketQty -= line.ticketType.multiple_of"
              />
            </template>
            <template #increment>
              <UButton
                icon="i-lucide-plus"
                title="tambah tiket"
                size="md"
                variant="ghost"
                @click="ticketQty += line.ticketType.multiple_of"
              />
            </template>
          </UInputNumber>

          <UButton
            size="xs"
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            :aria-label="`Hapus ${line.ticketType.name}`"
            @click="e('remove', line.ticketType.id)"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>
