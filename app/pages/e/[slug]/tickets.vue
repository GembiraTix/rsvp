<script setup lang="ts">
import type { TicketType, TicketTypeKind } from '~~/server/domain/types'
import { useEvents } from '@/composables/useEvents'
import { useTicketTypes } from '@/composables/useTicketTypes'
import { firstValidQty } from '@/composables/useTicketCart'

const route = useRoute()
const eventSlug = computed(() => route.params.slug as string)

const { fetchBySlug } = useEvents()
const { data: eventRes, error } = await fetchBySlug(eventSlug)

if (error.value || !eventRes.value?.data) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Acara tidak ditemukan',
  })
}

const event = computed(() => eventRes.value!.data)

const { fetchPublicByEvent } = useTicketTypes()
const { data: ticketTypesRes } = await fetchPublicByEvent(eventSlug)

const ticketTypes = computed(() => ticketTypesRes.value?.data ?? [])

const {
  isSelected,
  qtyOf,
  select,
  increment,
  decrement,
  remove,
  canIncrement,
  selectedLines,
  subtotal,
  totalQty,
} = useTicketCart(ticketTypes)

useSeoMeta({
  title: () => `${event.value?.title || 'Acara'} - Tiket`,
  description: () => event.value?.description || '',
})

function isSelectable(ticketType: TicketType) {
  return firstValidQty(ticketType) !== null
}

function quantityHint(ticketType: TicketType) {
  const parts: string[] = []

  if (ticketType.min_qty > 1) {
    parts.push(`minimal ${ticketType.min_qty}`)
  }

  if (ticketType.multiple_of > 1) {
    parts.push(`kelipatan ${ticketType.multiple_of}`)
  }

  parts.push(`maksimal ${ticketType.max_qty}`)

  return parts.join(', ')
}
</script>

<template>
  <div class="py-8 max-w-5xl mx-auto px-4 space-y-8">
    <UButton
      :to="`/e/${event.slug}`"
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
    >
      Kembali ke acara
    </UButton>

    <header class="space-y-2">
      <h1 class="text-3xl font-bold text-on-surface">Pilih Tiket</h1>
      <p class="text-on-surface-variant">
        {{ event.title }}
        <template v-if="event.starts_at">
          · {{ formatDate(event.starts_at) }}
        </template>
        <template v-if="event.location"> · {{ event.location }}</template>
      </p>
    </header>

    <UCard v-if="ticketTypes.length === 0">
      <p class="text-on-surface-variant">
        Belum ada tiket tersedia untuk acara ini.
      </p>

      <UButton
        :to="`/e/${event.slug}`"
        variant="outline"
        color="neutral"
        class="mt-4"
      >
        Kembali ke acara
      </UButton>
    </UCard>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <section class="lg:col-span-7 space-y-4">
        <UCard v-for="ticket in ticketTypes" :key="ticket.id">
          <div class="flex flex-col sm:flex-row sm:items-start gap-4">
            <div class="flex-1 space-y-1">
              <div class="flex items-center gap-2">
                <h2 class="text-lg text-on-surface">
                  {{ ticket.name }}
                </h2>
              </div>

              <p
                v-if="ticket.description"
                class="text-sm text-on-surface-variant"
              >
                {{ ticket.description }}
              </p>

              <p class="text-lg text-on-surface font-bold">
                {{ formatRupiah(ticket.price) }}
                <span class="text-xs"> · {{ quantityHint(ticket) }} </span>
                <span v-if="ticket.capacity" class="text-xs">
                  · kapasitas {{ ticket.capacity }}
                </span>
              </p>
            </div>

            <div class="sm:w-64 shrink-0">
              <UButton
                v-if="!isSelected(ticket)"
                color="primary"
                variant="soft"
                block
                label="Pilih"
                icon="i-lucide-add"
                :disabled="!isSelectable(ticket)"
                @click="select(ticket)"
              />

              <div v-else class="flex items-center justify-between gap-2">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="soft"
                  icon="i-lucide-minus"
                  :aria-label="`Kurangi jumlah ${ticket.name}`"
                  @click="decrement(ticket)"
                />

                <span class="font-mono font-semibold text-on-surface">
                  {{ qtyOf(ticket) }}
                </span>

                <UButton
                  size="xs"
                  color="neutral"
                  variant="soft"
                  icon="i-lucide-plus"
                  :aria-label="`Tambah jumlah ${ticket.name}`"
                  :disabled="!canIncrement(ticket)"
                  @click="increment(ticket)"
                />

                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  :aria-label="`Hapus ${ticket.name}`"
                  @click="remove(ticket)"
                />
              </div>
            </div>
          </div>
        </UCard>
      </section>

      <section class="lg:col-span-5">
        <UCard
          class="sticky top-20 shadow-xl border-outline"
          :ui="{ body: 'p-6 space-y-4' }"
        >
          <h2 class="text-xl font-bold text-on-surface">Ringkasan</h2>

          <p
            v-if="selectedLines.length === 0"
            class="text-sm text-on-surface-variant"
          >
            Belum ada tiket yang dipilih.
          </p>

          <ul v-else class="space-y-3">
            <li
              v-for="line in selectedLines"
              :key="line.ticketType.id"
              class="flex items-start justify-between gap-4 text-sm"
            >
              <div>
                <p class="font-medium text-on-surface">
                  {{ line.ticketType.name }}
                </p>
                <p class="text-on-surface-variant">
                  {{ line.qty }} × {{ formatRupiah(line.ticketType.price) }}
                </p>
              </div>
              <p class="font-mono text-on-surface">
                {{ formatRupiah(line.total) }}
              </p>
            </li>
          </ul>

          <div
            class="flex items-center justify-between pt-4 border-t border-outline"
          >
            <span class="text-on-surface-variant">
              Subtotal ({{ totalQty }} tiket)
            </span>
            <span class="text-xl font-bold text-on-surface">
              {{ formatRupiah(subtotal) }}
            </span>
          </div>

          <UButton color="primary" size="lg" block disabled>
            Lanjut ke Pembayaran
          </UButton>
        </UCard>
      </section>
    </div>
  </div>
</template>
