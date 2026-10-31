<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Detail Pesanan - GembiraTix',
})

const route = useRoute()
const orderId = route.params.id as string

const { fetchOrder, fetchTickets, resumePayment } = useOrders()

const {
  data: orderRes,
  error: orderError,
  status: orderStatus,
} = await fetchOrder(orderId)
console.log(orderError.value)
const { data: ticketsRes } = await fetchTickets(orderId)

const order = computed(() => orderRes.value?.data ?? null)
const tickets = computed(() => ticketsRes.value?.data ?? [])

const isResuming = ref(false)
const resumeErrorMessage = ref('')

async function handleResumePayment() {
  if (!order.value) return
  isResuming.value = true
  resumeErrorMessage.value = ''
  try {
    const res = await resumePayment(order.value.id)
    await navigateTo(res.data.redirectUrl, { external: true })
  } catch (err: unknown) {
    resumeErrorMessage.value =
      (err as { statusCode?: number; statusMessage?: string })?.statusMessage ||
      'Gagal melanjutkan pembayaran.'
  } finally {
    isResuming.value = false
  }
}
</script>

<template>
  <div class="py-8 max-w-3xl mx-auto px-4 space-y-6">
    <UButton
      to="/users?tab=pesanan"
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
    >
      Kembali ke pesanan
    </UButton>

    <template v-if="orderStatus === 'success' && order">
      <header class="space-y-2">
        <h1 class="text-3xl font-bold text-on-surface">
          {{ order.event?.title || 'Detail Pesanan' }}
        </h1>
        <p class="text-on-surface-variant">
          No. Pesanan <span class="font-mono">#{{ order.order_number }}</span>
        </p>
      </header>

      <UAlert
        v-if="resumeErrorMessage"
        :title="resumeErrorMessage"
        icon="i-lucide-alert-circle"
        color="error"
        variant="subtle"
        close
        @update:open="resumeErrorMessage = ''"
      />

      <UCard>
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm text-on-surface-variant">Status</p>
              <UBadge
                :color="orderStatusStyle(order.status).color"
                variant="subtle"
                class="mt-1"
              >
                {{ orderStatusStyle(order.status).label }}
              </UBadge>
            </div>
            <UButton
              v-if="isOrderPayable(order)"
              color="primary"
              icon="i-lucide-credit-card"
              :loading="isResuming"
              @click="handleResumePayment"
            >
              Lanjutkan Pembayaran
            </UButton>
          </div>

          <div class="divide-y divide-outline border-t border-outline">
            <div class="py-3 flex items-center justify-between gap-4 text-sm">
              <span class="text-on-surface-variant">Tanggal pesanan</span>
              <span class="text-on-surface">{{
                formatDate(order.created_at)
              }}</span>
            </div>
            <div class="py-3 flex items-center justify-between gap-4 text-sm">
              <span class="text-on-surface-variant">Subtotal</span>
              <span class="text-on-surface">{{
                formatRupiah(order.subtotal)
              }}</span>
            </div>
            <div class="py-3 flex items-center justify-between gap-4 text-sm">
              <span class="text-on-surface-variant">Biaya layanan</span>
              <span class="text-on-surface">{{
                formatRupiah(order.admin_fee)
              }}</span>
            </div>
            <div class="py-3 flex items-center justify-between gap-4">
              <span class="font-medium text-on-surface">Total</span>
              <span class="font-bold text-on-surface">
                {{ formatRupiah(order.total ?? 0) }}
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <section class="space-y-3">
        <h2 class="text-xl font-bold text-on-surface">
          Tiket ({{ tickets.length }})
        </h2>

        <div v-if="order.status === 'paid'" class="space-y-3">
          <OrderTicket
            v-for="ticket in tickets"
            :key="ticket.id"
            :ticket="ticket"
          />
          <p
            v-if="tickets.length === 0"
            class="text-sm text-on-surface-variant"
          >
            Tiket belum tersedia. Tiket akan diterbitkan setelah pembayaran
            terkonfirmasi.
          </p>
        </div>
        <p v-else class="text-sm text-on-surface-variant">
          Tiket akan muncul di sini setelah pembayaran selesai.
        </p>
      </section>
    </template>

    <div v-else-if="orderStatus === 'pending'" class="p-8 text-center">
      <USpinner class="size-8" />
    </div>

    <UAlert
      v-else-if="orderError"
      title="Pesanan tidak ditemukan."
      color="error"
      variant="subtle"
      icon="i-lucide-alert-circle"
    />
  </div>
</template>
