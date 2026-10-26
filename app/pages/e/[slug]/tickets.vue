<script setup lang="ts">
import { useEvents } from '@/composables/useEvents'
import { useTicketTypes } from '@/composables/useTicketTypes'
import { useTicketCart } from '@/composables/useTicketCart'

const route = useRoute()
const router = useRouter()
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
const { cart, totalQty, subtotal, selectedLines, encode, select, remove } =
  useTicketCart(ticketTypes)

useSeoMeta({
  title: () => `${event.value?.title || 'Acara'} - Tiket`,
  description: () => event.value?.description || '',
})

function goToCheckout() {
  const cartParam = encode(selectedLines.value)
  router.push(`/e/${eventSlug.value}/checkout?cart=${cartParam}`)
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
        <template v-for="cartLine of cart">
          <TicketSelect
            @select="select(cartLine.ticketType.id)"
            @remove="remove(cartLine.ticketType.id)"
            :line="cartLine"
            v-model="cartLine.qty"
          />
        </template>
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
            <TicketOrderLine
              v-for="line in selectedLines"
              :key="line.ticketType.id"
              :line="line"
            />
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

          <UButton
            color="primary"
            size="lg"
            block
            :disabled="subtotal === 0"
            @click="goToCheckout"
          >
            Lanjut ke Pembayaran
          </UButton>
        </UCard>
      </section>
    </div>
  </div>
</template>
