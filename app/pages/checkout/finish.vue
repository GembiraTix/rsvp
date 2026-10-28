<script setup lang="ts">
import { formatRupiah } from '@/utils'

const route = useRoute()

type OrderSummary = {
  id: string
  order_number: string
  event_id: number
  total: number | null
  status: string
}

const orderId = route.query.orderId as string | undefined
const status = route.query.status as string | undefined

if (!orderId) {
  navigateTo('/') // TODO
}

const order = ref<OrderSummary | null>(null)
const {
  data: orderRes,
  error,
  status: orderResStatus,
} = useAsyncData(() =>
  $fetch<{ success: boolean; data: OrderSummary }>(`/api/orders/${orderId}`, {
    method: 'GET',
  }),
)

if (orderRes.value && !error) {
  order.value = orderRes.value.data
}

const statusLabels: Record<
  string,
  { title: string; variant: 'error' | 'success' | 'warning' | 'info' }
> = {
  paid: { title: 'Pembayaran berhasil', variant: 'success' },
  failed: { title: 'Pembayaran gagal', variant: 'error' },
  expired: { title: 'Pembayaran kadaluarsa', variant: 'error' },
  cancelled: { title: 'Pembayaran dibatalkan', variant: 'error' },
  pending: { title: 'Pembayaran sedang diproses', variant: 'warning' },
}

const statusKey = (status ?? 'pending') as keyof typeof statusLabels
const pendingStatus = {
  title: 'Pembayaran sedang diproses',
  variant: 'warning' as const,
}
const currentStatus = computed(() => statusLabels[statusKey] ?? pendingStatus)
</script>

<template>
  <div class="py-8 max-w-5xl mx-auto px-4 space-y-8">
    <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-arrow-left">
      Kembali ke beranda
    </UButton>

    <header class="space-y-2">
      <h1 class="text-3xl font-bold text-on-surface">Selesai</h1>
      <p class="text-on-surface-variant">Status pembayaran pesanan Anda</p>
    </header>

    <UAlert
      :color="currentStatus.variant"
      :title="currentStatus.title"
      class="rounded-lg"
    >
      <template #description>
        <p v-if="status === 'paid' && order" class="text-on-surface-variant">
          Pesanan Anda telah dibayar. Tiket akan segera tersedia untuk dicek-in.
        </p>
        <p
          v-else-if="
            status === 'failed' ||
            status === 'expired' ||
            status === 'cancelled'
          "
          class="text-on-surface-variant"
        >
          Pembayaran tidak berhasil. Silakan coba lagi atau hubungi
          penyelenggara acara.
        </p>
        <p v-else-if="status === 'pending'" class="text-on-surface-variant">
          Kami sedang memproses pembayaran Anda. Silakan tunggu sebentar.
        </p>
      </template>
    </UAlert>

    <div v-if="orderResStatus === 'success' && order" class="space-y-4">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-on-surface">Rincian Pesanan</h3>
            <span class="text-xs font-mono text-on-surface-variant">
              #{order.order_number}
            </span>
          </div>
        </template>
        <div class="divide-y divide-outline">
          <div class="p-4 flex items-start justify-between gap-4">
            <div>
              <p class="font-medium text-on-surface">
                {{ order.event_id }}
              </p>
              <p class="text-sm text-on-surface-variant">
                Total: {{ formatRupiah(order.total ?? 0) }}
              </p>
            </div>
            <p class="font-mono text-on-surface">
              {{ order.status }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <div v-else-if="orderResStatus === 'pending'" class="p-8 text-center">
      <USpinner />
    </div>
  </div>
</template>
