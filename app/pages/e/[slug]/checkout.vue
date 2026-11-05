<script setup lang="ts">
import { useCountdown } from '@vueuse/core'
import { useEvents } from '@/composables/useEvents'
import { useTicketTypes } from '@/composables/useTicketTypes'
import { formatRupiah, formatCountdown } from '@/utils'
import { useUserProfile } from '@/composables/useUserProfile'
import {
  useAttendeeDraft,
  type AttendeeDraft,
} from '@/composables/useAttendeeDraft'

const route = useRoute()
const eventSlug = computed(() => route.params.slug as string)

const { fetchProfile } = useUserProfile()
const { data: profileRes } = await fetchProfile()
const profile = computed(() => profileRes.value?.data || null)

const { fetchBySlug } = useEvents()
const { data: eventRes, error: eventError } = await fetchBySlug(eventSlug)

if (eventError.value || !eventRes.value?.data) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Acara tidak ditemukan',
  })
}

const event = computed(() => eventRes.value!.data)

const { fetchPublicByEvent } = useTicketTypes()
const { data: ticketTypesRes } = await fetchPublicByEvent(eventSlug)

const ticketTypes = computed(() => ticketTypesRes.value?.data ?? [])

const { cart, selectedLines, subtotal, totalQty, decode } =
  useTicketCart(ticketTypes)

const { load: loadDraft, clear: clearDraft } = useAttendeeDraft(eventSlug)

const attendeeDraft = ref<AttendeeDraft[]>([])

onMounted(() => {
  // TODO: handle nonexistent cart param
  try {
    cart.value = decode(route.query.cart as string)
  } catch {
    cart.value = []
    checkoutError.value =
      'Keranjang tidak valid. Silakan pilih tiket kembali dari halaman acara.'
    return
  }

  attendeeDraft.value = loadDraft()
  if (attendeeDraft.value.length === 0) {
    navigateTo(`/e/${eventSlug.value}/tickets`)
  }
})

// Checkout state
type CheckoutResult = {
  success: true
  data: {
    orderId: string
    snapToken: string
    redirectUrl: string
  }
}

const isLoading = ref(false)
const checkoutResult = ref<CheckoutResult | null>(null)
const checkoutError = ref('')

const ORDER_TIME_LIMIT_S = 10 * 60 // 10 minutes

const { remaining, start } = useCountdown(ORDER_TIME_LIMIT_S)

onMounted(() => {
  start()
})

const isTimeUp = computed(() => remaining.value === 0 && !checkoutResult.value)

async function handleBayar() {
  if (!profile.value) {
    checkoutError.value =
      'Silakan masuk terlebih dahulu untuk melanjutkan pembayaran.'
    return
  }

  if (selectedLines.value.length === 0) {
    checkoutError.value = 'Belum ada tiket yang dipilih.'
    return
  }

  isLoading.value = true
  checkoutError.value = ''
  checkoutResult.value = null

  try {
    const res = await $fetch<CheckoutResult>('/api/checkout/create', {
      method: 'POST',
      body: {
        eventId: event.value.id,
        lines: selectedLines.value.map((l) => ({
          ticketTypeId: l.ticketType.id,
          qty: l.qty,
          attendees: attendeeDraft.value
            .filter((u) => u.ticketTypeId === l.ticketType.id)
            .map((u) => ({
              name: u.name,
              identityType: u.identityType,
              identityNumber: u.identityNumber,
              email: u.email,
              whatsapp: u.whatsapp,
              gender: u.gender,
            })),
        })),
      },
    })

    checkoutResult.value = res
    clearDraft()

    navigateTo(checkoutResult.value.data.redirectUrl, { external: true })
  } catch (err: unknown) {
    checkoutError.value =
      err instanceof Error
        ? err.message
        : 'Gagal membuat pesanan. Silakan coba lagi.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="py-8 max-w-5xl mx-auto px-4 space-y-8">
    <PageHeader
      :back-to="`/e/${event.slug}/register`"
      back-label="Kembali ke data peserta"
      title="Checkout"
      :description="event.title"
    />

    <UBanner
      v-if="selectedLines.length > 0 && !checkoutResult"
      color="warning"
      icon="i-lucide-timer"
    >
      <template #title>
        <span class="flex items-center gap-2">
          Sisa waktu pemesanan
          <span class="font-mono tabular-nums font-bold">
            {{ formatCountdown(remaining) }}
          </span>
        </span>
      </template>
    </UBanner>

    <UAlert v-if="checkoutError" color="error" :description="checkoutError" />

    <UAlert
      v-if="!profile"
      title="Tunggu dulu..."
      description="Anda perlu akun untuk menyelesaikan pembayaran. Silakan login atau membuat akun terlebih dahulu."
      variant="outline"
      icon="i-lucide-info"
    >
      <template #actions>
        <UButton
          :to="`/login?redirectTo=${route.fullPath}`"
          color="primary"
          variant="soft"
          class="mt-3"
        >
          Masuk
        </UButton>
      </template>
    </UAlert>

    <template v-else-if="checkoutResult">
      <div class="bg-success/10 border border-success rounded-lg p-4">
        <h2 class="text-lg font-bold text-on-surface">
          Mengarahkan ke pembayaran...
        </h2>
        <p class="text-on-surface-variant">
          Kalau kamu tidak segera diarahkan ke halaman pembayaran, klik di bawah
          ini.
        </p>

        <UButton
          color="primary"
          :to="checkoutResult.data.redirectUrl"
          external
          target="_self"
          class="mt-4 w-full"
        >
          Bayar
        </UButton>
      </div>
    </template>

    <div
      v-else-if="event"
      class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
    >
      <section class="lg:col-span-7 space-y-4">
        <UCard title="Rincian pesanan">
          <div v-if="selectedLines.length === 0" class="p-6 text-center">
            <p class="text-on-surface-variant">Belum ada tiket yang dipilih.</p>
          </div>

          <ul v-else class="divide-y divide-outline">
            <TicketCheckoutLine
              v-for="line in selectedLines"
              :key="line.ticketType.id"
              :line="line"
            />
          </ul>
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

          <USeparator />

          <div class="flex items-center justify-between">
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
            :loading="isLoading"
            :disabled="selectedLines.length === 0 || !profile"
            @click="handleBayar"
          >
            Bayar
          </UButton>
        </UCard>
      </section>
    </div>

    <UModal
      :open="isTimeUp"
      :close="false"
      :dismissible="false"
      title="Waktu pemesanan habis"
      description="Batas waktu 10 menit untuk menyelesaikan pesanan sudah terlewati. Silakan kembali ke halaman tiket."
    >
      <template #footer>
        <UButton
          size="lg"
          block
          icon="i-lucide-arrow-left"
          @click="navigateTo(`/e/${event.slug}`)"
        >
          Kembali ke acara
        </UButton>
      </template>
    </UModal>
  </div>
</template>
