<script setup lang="ts">
import type { Event } from '~~/server/domain/types'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import { z } from 'zod'

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

import { useUserProfile } from '@/composables/useUserProfile'

const { fetchProfile, updateProfile: apiUpdateProfile } = useUserProfile()
const { data: profileRes, refresh: refreshProfile } = await fetchProfile()
const profile = computed(() => profileRes.value?.data || null)

const isUpdatingProfile = ref(false)
const profileErrorMessage = ref('')
const profileSuccessMessage = ref('')

const profileFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.'),
  profile: z.instanceof(File).optional(), // TODO: implement in the future
})

type ProfileFormState = z.output<typeof profileFormSchema>

const profileFormState = reactive<ProfileFormState>({
  name: profile.value?.name || '',
  profile: undefined,
})

async function handleUpdateProfile(e: FormSubmitEvent<ProfileFormState>) {
  if (!user.value) return
  isUpdatingProfile.value = true
  profileErrorMessage.value = ''
  profileSuccessMessage.value = ''

  try {
    await apiUpdateProfile(e.data.name)
    await refreshProfile()
    profileSuccessMessage.value = 'Profil berhasil diperbarui!'
  } catch (err: unknown) {
    if (err instanceof Error) {
      profileErrorMessage.value = err.message
    } else {
      profileErrorMessage.value = 'Gagal memperbarui profil.'
    }
  } finally {
    isUpdatingProfile.value = false
  }
}

import { useEvents } from '@/composables/useEvents'

const { fetchAll } = useEvents()

const { data: organizedRes } = await fetchAll()
const organizedEvents = computed(() =>
  ['admin', 'super_admin'].includes(profile.value?.role!)
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

import { useOrders } from '@/composables/useOrders'
import type { OrderWithEvent } from '~~/server/domain/types'

const { fetchOrders, resumePayment } = useOrders()

const { data: ordersRes, error: ordersError } = await fetchOrders()
const orders = computed(() => ordersRes.value?.data ?? [])

const resumingOrderId = ref<string | null>(null)
const resumeErrorMessage = ref('')

async function handleResumePayment(order: OrderWithEvent) {
  resumingOrderId.value = order.id
  resumeErrorMessage.value = ''
  try {
    const res = await resumePayment(order.id)
    await navigateTo(res.data.redirectUrl, { external: true })
  } catch (err: unknown) {
    resumeErrorMessage.value =
      (err as { statusCode?: number; statusMessage?: string })?.statusMessage ||
      'Gagal melanjutkan pembayaran.'
  } finally {
    resumingOrderId.value = null
  }
}

const { data: joinedRsvps } = await useAsyncData(
  `joined-rsvps-${user.value?.email}`,
  async () => {
    if (!user.value?.email) return []
    const { data, error } = await supabase
      .from('rsvps')
      .select('id, token, is_attending, created_at, events (*)')
      .eq('email', user.value.email)
      .eq('is_attending', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },
)

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
      variant="link"
      v-model="selectedTab"
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
                Acara Yang Anda Ikuti ({{ joinedRsvps?.length || 0 }})
              </h2>
            </div>

            <UCard class="border-outline" :ui="{ body: 'p-0 sm:p-0' }">
              <div
                v-if="joinedRsvps && joinedRsvps.length > 0"
                class="overflow-x-auto"
              >
                <table class="w-full text-left text-sm">
                  <thead
                    class="bg-surface-container border-b border-outline text-xs font-semibold text-on-surface-variant uppercase"
                  >
                    <tr>
                      <th class="px-6 py-3">Acara</th>
                      <th class="px-6 py-3">Lokasi</th>
                      <th class="px-6 py-3">Ref RSVP</th>
                      <th class="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline">
                    <tr
                      v-for="rsvp in joinedRsvps"
                      :key="rsvp.id"
                      class="hover:bg-surface-container/50"
                    >
                      <td class="px-6 py-4 font-medium text-on-surface">
                        {{ rsvp.events?.title || 'Acara' }}
                      </td>
                      <td class="px-6 py-4 text-on-surface-variant">
                        {{ rsvp.events?.location || '-' }}
                      </td>
                      <td
                        class="px-6 py-4 text-xs font-mono text-on-surface-variant"
                      >
                        {{ rsvp.token.slice(0, 8) }}...
                      </td>
                      <td class="px-6 py-4 text-right space-x-2">
                        <UButton
                          :to="`/rsvp/${rsvp.token}`"
                          size="xs"
                          color="neutral"
                          variant="outline"
                        >
                          Lihat Tiket
                        </UButton>
                        <UButton
                          v-if="rsvp.events?.slug"
                          :to="`/e/${rsvp.events.slug}`"
                          size="xs"
                          color="neutral"
                          variant="ghost"
                          icon="i-lucide-external-link"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="p-8 text-center space-y-3">
                <UIcon
                  name="i-lucide-ticket-slash"
                  class="w-10 h-10 mx-auto text-on-surface-variant"
                />
                <p class="text-sm text-on-surface-variant">
                  Anda belum mengikuti acara apa pun.
                </p>
                <UButton to="/" color="neutral" variant="outline" size="sm">
                  Jelajahi Acara Publik
                </UButton>
              </div>
            </UCard>
          </section>
        </template>
      </template>
    </UTabs>
  </div>
</template>
