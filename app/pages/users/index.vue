<script setup lang="ts">
import type {
  Event,
  OrderWithEvent,
  RsvpWithEvent,
} from '~~/server/domain/types'
import type { TableColumn } from '@nuxt/ui'

import { useUserProfile } from '@/composables/useUserProfile'
import { useEvents } from '@/composables/useEvents'
import { useOrders } from '@/composables/useOrders'
import { useResumePayment } from '@/composables/useResumePayment'
import { useRsvp } from '@/composables/useRsvp'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Dasbor Saya - GembiraTix',
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

watch(
  user,
  () => {
    if (!user.value) return navigateTo('/login')
  },
  { immediate: true },
)

const { fetchProfile } = useUserProfile()
const { data: profileRes } = await fetchProfile()
const profile = computed(() => profileRes.value?.data || null)

const { fetchAll } = useEvents()

const { data: organizedRes } = await fetchAll()
const organizedEvents = computed(() =>
  ['admin', 'super_admin'].includes(profile.value?.role ?? '')
    ? organizedRes.value?.data
    : [],
)
const organizedEventsColumns: TableColumn<Event>[] = [
  {
    accessorKey: 'title',
    header: 'Judul',
  },
  {
    accessorKey: 'starts_at',
    header: 'Tanggal mulai',
    cell: ({ row }) => {
      const d = row.original.starts_at
      return d ? formatDate(d) : '-'
    },
  },
  {
    accessorKey: 'ends_at',
    header: 'Tanggal akhir',
    cell: ({ row }) => {
      const d = row.original.ends_at
      return d ? formatDate(d) : '-'
    },
  },
  {
    accessorKey: 'location',
    header: 'Lokasi',
  },
  {
    id: 'action',
    header: 'Aksi',
  },
]

const { fetchOrders } = useOrders()

const { data: ordersRes, error: ordersError } = await fetchOrders()
const orders = computed(() => ordersRes.value?.data ?? [])

const { resumingOrderId, resumeErrorMessage, resume } = useResumePayment()

const ordersColumns: TableColumn<OrderWithEvent>[] = [
  {
    id: 'acara',
    header: 'Acara',
    cell: ({ row }) => row.original.event?.title || 'Acara',
  },
  {
    accessorKey: 'order_number',
    header: 'No. Pesanan',
  },
  {
    accessorKey: 'created_at',
    header: 'Tanggal',
    cell: ({ row }) => formatDate(row.original.created_at),
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => formatRupiah(row.original.total ?? 0),
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    id: 'action',
    header: 'Aksi',
  },
]

const { fetchJoined } = useRsvp()

const { data: joinedRes } = await fetchJoined()
const joinedRsvps = computed(() => joinedRes.value?.data ?? [])

const joinedRsvpsColumns: TableColumn<RsvpWithEvent>[] = [
  {
    id: 'acara',
    header: 'Acara',
    cell: ({ row }) => row.original.event?.title || 'Acara',
  },
  {
    id: 'lokasi',
    header: 'Lokasi',
    cell: ({ row }) => row.original.event?.location || '-',
  },
  {
    accessorKey: 'token',
    header: 'Ref RSVP',
  },
  {
    id: 'action',
    header: 'Aksi',
  },
]

const selectedTab = useTabQuery('acara')

const tabItems = [
  {
    label: 'Acara',
    value: 'acara',
  },
  {
    label: 'Pesanan',
    value: 'pesanan',
  },
  {
    label: 'Akun',
    value: 'akun',
  },
]

async function handleLogout() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="py-8 max-w-6xl mx-auto px-4 space-y-10">
    <UTabs
      v-model="selectedTab"
      variant="link"
      :items="tabItems"
      class="gap-y-6"
    >
      <template #content="{ item }">
        <div v-if="item.value === 'pesanan'" class="space-y-4">
          <UAlert
            v-if="resumeErrorMessage"
            :title="resumeErrorMessage"
            icon="i-lucide-alert-circle"
            color="error"
            variant="subtle"
            class="my-4"
            close
            @update:open="resumeErrorMessage = ''"
          />

          <UCard class="border-outline" :ui="{ body: 'p-0 sm:p-0' }">
            <UTable :data="orders" :columns="ordersColumns">
              <template #order_number-cell="{ row }">
                <span class="font-mono text-xs text-on-surface-variant">
                  #{{ row.original.order_number }}
                </span>
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  :color="orderStatusStyle(row.original.status).color"
                  variant="subtle"
                  size="sm"
                >
                  {{ orderStatusStyle(row.original.status).label }}
                </UBadge>
              </template>

              <template #action-cell="{ row }">
                <div class="flex gap-2 justify-end whitespace-nowrap">
                  <UButton
                    v-if="isOrderPayable(row.original)"
                    size="xs"
                    color="primary"
                    :loading="resumingOrderId === row.original.id"
                    @click="resume(row.original)"
                  >
                    Lanjutkan Pembayaran
                  </UButton>
                  <UButton
                    :to="`/users/orders/${row.original.id}`"
                    size="xs"
                    color="neutral"
                    variant="outline"
                  >
                    Detail
                  </UButton>
                </div>
              </template>

              <template #empty>
                <UEmpty
                  icon="i-lucide-receipt-text"
                  :title="
                    ordersError
                      ? 'Gagal memuat pesanan.'
                      : 'Anda belum memiliki pesanan apa pun.'
                  "
                >
                  <template #actions>
                    <UButton to="/" color="neutral" variant="outline" size="sm">
                      Jelajahi Acara Publik
                    </UButton>
                  </template>
                </UEmpty>
              </template>
            </UTable>
          </UCard>
        </div>

        <div v-if="item.value === 'akun'" class="space-y-6">
          <ProfileEditForm />

          <UCard>
            <template #header>
              <h2 class="text-lg font-bold">Preferensi</h2>
            </template>

            <article
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <p class="text-on-surface">Mode warna aplikasi</p>
              <UColorModeSelect size="lg" />
            </article>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="text-lg font-bold">Otentikasi</h2>
            </template>

            <article
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <h3 class="font-semibold font-lg">Keluar</h3>
                <p class="text-on-surface-variant">Keluar dari akun anda</p>
              </div>

              <UButton
                variant="outline"
                color="error"
                icon="i-lucide-log-out"
                @click="handleLogout"
              >
                Keluar
              </UButton>
            </article>
          </UCard>
        </div>

        <template v-if="item.value === 'acara'">
          <section
            v-if="['admin', 'super_admin'].includes(profile?.role || 'user')"
            class="space-y-4"
          >
            <div class="flex items-center justify-between">
              <h2
                class="text-xl font-bold text-on-surface flex items-center gap-2"
              >
                Acara Anda ({{ organizedEvents?.length || 0 }})
              </h2>

              <div class="flex items-center gap-3">
                <UButton
                  v-if="profile?.role === 'super_admin'"
                  to="/admin/users"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-users"
                >
                  Kelola Pengguna
                </UButton>
                <UButton
                  to="/users/events/new"
                  color="primary"
                  icon="i-lucide-plus"
                >
                  Buat Acara Baru
                </UButton>
              </div>
            </div>

            <UCard class="border-outline" :ui="{ body: 'p-0 sm:p-0' }">
              <UTable
                :data="organizedEvents"
                :columns="organizedEventsColumns"
                :caption="`Menampilkan ${organizedEvents?.length ?? 0} acara`"
              >
                <template #action-cell="{ row }">
                  <div class="flex gap-4">
                    <UButton
                      :to="`/e/${row.original.slug}/manage`"
                      label="Kelola"
                      icon="i-lucide-settings"
                      variant="outline"
                    />

                    <UButton
                      :to="`/e/${row.original.slug}/`"
                      title="Lihat halaman publik"
                      icon="i-lucide-external-link"
                      variant="outline"
                    />
                  </div>
                </template>

                <template #empty>
                  <div class="grid place-items-center gap-3">
                    <UIcon
                      name="i-lucide-calendar-plus"
                      class="w-10 h-10 mx-auto text-on-surface-variant"
                    />
                    <p class="text-sm text-on-surface-variant">
                      Anda belum menggelar acara apa pun.
                    </p>
                    <UButton
                      to="/users/events/new"
                      color="primary"
                      variant="outline"
                      size="sm"
                    >
                      Buat Acara Pertama Anda
                    </UButton>
                  </div>
                </template>
              </UTable>
            </UCard>
          </section>

          <section v-else class="space-y-4">
            <div class="flex items-center justify-between">
              <h2
                class="text-xl font-bold text-on-surface flex items-center gap-2"
              >
                Acara Yang Anda Ikuti ({{ joinedRsvps.length }})
              </h2>
            </div>

            <UCard class="border-outline" :ui="{ body: 'p-0 sm:p-0' }">
              <UTable
                :data="joinedRsvps"
                :columns="joinedRsvpsColumns"
                caption="Menampilkan acara yang Anda ikuti"
              >
                <template #token-cell="{ row }">
                  <span class="text-xs font-mono text-on-surface-variant">
                    {{ row.original.token.slice(0, 8) }}...
                  </span>
                </template>

                <template #action-cell="{ row }">
                  <div class="flex gap-2 justify-end">
                    <UButton
                      :to="`/rsvp/${row.original.token}`"
                      size="xs"
                      color="neutral"
                      variant="outline"
                    >
                      Lihat Tiket
                    </UButton>
                    <UButton
                      v-if="row.original.event?.slug"
                      :to="`/e/${row.original.event.slug}`"
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-external-link"
                    />
                  </div>
                </template>

                <template #empty>
                  <UEmpty
                    icon="i-lucide-ticket-slash"
                    title="Anda belum mengikuti acara apa pun."
                  >
                    <template #actions>
                      <UButton
                        to="/"
                        color="neutral"
                        variant="outline"
                        size="sm"
                      >
                        Jelajahi Acara Publik
                      </UButton>
                    </template>
                  </UEmpty>
                </template>
              </UTable>
            </UCard>
          </section>
        </template>
      </template>
    </UTabs>
  </div>
</template>
