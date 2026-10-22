<script setup lang="ts">
import { useEvents } from '@/composables/useEvents'
import { useUserProfile } from '@/composables/useUserProfile'
import { useTicketTypes } from '@/composables/useTicketTypes'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Event, TicketTypeKind } from '~~/server/domain/types'
import { z } from 'zod'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const eventSlug = computed(() => route.params.slug as string)

const tabItems = computed(() => {
  const items = [
    {
      label: 'Overview',
      value: 'overview',
      icon: 'i-lucide-layout-dashboard',
    },
    {
      label: 'Registrasi',
      value: 'registrasi',
      icon: 'i-lucide-ticket',
    },
  ]

  if (isSuperAdmin.value) {
    items.push({
      label: 'More',
      value: 'more',
      icon: 'i-lucide-settings-2',
    })
  }

  return items
})

const selectedTab = computed({
  get() {
    const tab = route.query.tab as string
    return tab || 'overview'
  },
  set(val: string) {
    router.push({
      query: { ...route.query, tab: val },
    })
  },
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const {
  fetchBySlug,
  updateRegistrationLimit: apiUpdateRegistrationLimit,
  deleteEvent: apiDeleteEvent,
} = useEvents()
const { data: eventRes, error: eventError } = await fetchBySlug(eventSlug)

if (eventError.value || !eventRes.value?.data) {
  throw createError({ statusCode: 404, statusMessage: 'Acara tidak ditemukan' })
}

const event = computed(() => eventRes.value!.data)

const { fetchProfile } = useUserProfile()
const { data: profileRes } = await fetchProfile()
const profile = computed(() => profileRes.value?.data || null)
const isSuperAdmin = computed(() => profile.value?.role === 'super_admin')

// Check authorization (Must be event creator or super_admin)
const isCreator = computed(
  () =>
    (user.value &&
      event.value &&
      event.value.created_by === (user.value.sub || user.value.id)) ||
    isSuperAdmin.value,
)

if (!isCreator) {
  navigateTo('/')
}

const isSavingRegistration = ref(false)

const eventLimitFormSchema = z.object({
  enabled: z.boolean().default(false),
  value: z.number().positive('batas registrasi harus positif.'),
})

type EventLimitFormShema = z.output<typeof eventLimitFormSchema>
const eventLimitFormState = ref<EventLimitFormShema>({
  enabled: false,
  value: 1,
})

const registrationAlert = ref<{
  title: string
  type: 'success' | 'error'
  message: string
} | null>(null)

async function saveRegistrationLimit(
  eventId: number,
  { data }: FormSubmitEvent<EventLimitFormShema>,
) {
  isSavingRegistration.value = true
  registrationAlert.value = null
  try {
    const limit = data.enabled ? data.value : null
    await apiUpdateRegistrationLimit(eventId, {
      enabled: data.enabled,
      limit,
    })
    registrationAlert.value = {
      title: 'Berhasil',
      type: 'success',
      message: 'Batas pendaftaran berhasil disimpan.',
    }
  } catch (err: unknown) {
    registrationAlert.value = {
      title: 'Gagal',
      type: 'error',
      message:
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan batas pendaftaran.',
    }
  } finally {
    isSavingRegistration.value = false
  }
}

const isDeletingEvent = ref(false)

async function handleDeleteEvent(event: Event) {
  isDeletingEvent.value = true
  try {
    await apiDeleteEvent(event.id)
    await navigateTo('/users')
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Gagal menghapus acara.')
  } finally {
    isDeletingEvent.value = false
  }
}

// Fetch attendees roster
const { data: attendees, refresh: refreshAttendees } = await useAsyncData(
  `event-attendees-${event.value?.id}`,
  async () => {
    if (!event.value?.id) return []
    const { data, error } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', event.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },
)

useSeoMeta({
  title: () => (event.value ? `Kelola ${event.value.title}` : 'Kelola Acara'),
  description: () =>
    `Pengelolaan acara dan daftar peserta untuk ${event.value?.title || 'acara'}`,
})

const attendeeSearch = ref('')

const filteredAttendees = computed(() => {
  if (!attendees.value) return []
  if (!attendeeSearch.value.trim()) return attendees.value
  const q = attendeeSearch.value.toLowerCase()
  return attendees.value.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.organization && a.organization.toLowerCase().includes(q)),
  )
})

function exportCSV() {
  if (!attendees.value || !event.value) return
  const headers = ['ID', 'Nama', 'Email', 'Organisasi', 'Tanggal RSVP', 'Hadir']
  const rows = attendees.value.map((a) => [
    a.id,
    `"${a.name}"`,
    `"${a.email || ''}"`,
    `"${a.organization || ''}"`,
    `"${a.created_at}"`,
    `"${a.is_attending}"`,
  ])
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `peserta-${event.value.slug}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function removeAttendee(id: number) {
  if (!confirm('Hapus peserta ini dari daftar RSVP?')) return
  const { error } = await supabase.from('rsvps').delete().eq('id', id)
  if (!error) {
    await refreshAttendees()
  }
}

const ticketTypeFormSchema = z.object({
  name: z.string().nonempty('Nama tiket wajib diisi.'),
  description: z.string().optional(),
  kind: z.enum(['single', 'couple', 'berempat']),
  price: z.coerce.number().int().min(0, 'Harga tidak valid.'),
  capacity: z.coerce.number().int().positive().optional(),
  min_qty: z.number().int().min(1, 'Jumlah minimal harus minimal 1.'),
  max_qty: z.number().int().min(1, 'Jumlah maksimal harus minimal 1.'),
  multiple_of: z.number().int().min(1, 'Kelipatan harus minimal 1.'),
  is_active: z.boolean(),
})

type TicketTypeForm = z.output<typeof ticketTypeFormSchema>

const ticketTypeFormState = reactive<TicketTypeForm>({
  name: '',
  description: '',
  kind: 'single',
  price: 0,
  capacity: undefined,
  min_qty: 1,
  max_qty: 10,
  multiple_of: 1,
  is_active: true,
})

const { fetchByEvent: fetchTicketTypes, createTicketType } = useTicketTypes()
const { data: ticketTypesRes, refresh: refreshTicketTypes } =
  await fetchTicketTypes(eventSlug)

const ticketTypes = computed(() => ticketTypesRes.value?.data ?? [])

const isTicketTypeModalOpen = ref(false)
const isSavingTicketType = ref(false)
const ticketTypeError = ref('')

function resetTicketTypeForm() {
  ticketTypeFormState.name = ''
  ticketTypeFormState.description = ''
  ticketTypeFormState.kind = 'single'
  ticketTypeFormState.price = 0
  ticketTypeFormState.capacity = undefined
  ticketTypeFormState.min_qty = 1
  ticketTypeFormState.max_qty = 10
  ticketTypeFormState.multiple_of = 1
  ticketTypeFormState.is_active = true
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { statusMessage?: string } }).data
    if (data?.statusMessage) {
      return data.statusMessage
    }
  }

  return err instanceof Error ? err.message : fallback
}

async function handleAddTicketType(e: FormSubmitEvent<TicketTypeForm>) {
  isSavingTicketType.value = true
  ticketTypeError.value = ''

  try {
    await createTicketType(eventSlug.value, {
      name: e.data.name,
      description: e.data.description || null,
      kind: e.data.kind,
      price: e.data.price,
      capacity: e.data.capacity ?? null,
      minQty: e.data.min_qty,
      maxQty: e.data.max_qty,
      multipleOf: e.data.multiple_of,
      isActive: e.data.is_active,
    })

    await refreshTicketTypes()
    resetTicketTypeForm()
    isTicketTypeModalOpen.value = false
  } catch (err: unknown) {
    ticketTypeError.value = getErrorMessage(
      err,
      'Gagal membuat tipe tiket. Silakan coba lagi.',
    )
  } finally {
    isSavingTicketType.value = false
  }
}

const ticketTypeKindLabels: Record<TicketTypeKind, string> = {
  single: 'Single',
  couple: 'Couple',
  berempat: 'Berempat',
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}
</script>

<template>
  <div class="py-8 max-w-6xl mx-auto px-4 space-y-6">
    <UButton
      to="/users"
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
    >
      Kembali ke Dasbor
    </UButton>

    <template v-if="event">
      <UTabs
        v-model="selectedTab"
        :items="tabItems"
        variant="link"
        class="w-full gap-y-6"
      >
        <template #content="{ item }">
          <section v-if="item.value === 'overview'" class="space-y-6">
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-surface-container border border-outline"
            >
              <div>
                <h1 class="text-2xl font-bold text-on-surface mb-2">
                  {{ event.title }}
                </h1>
                <time
                  class="text-on-surface-variant"
                  :datetime="event.starts_at"
                  v-if="event.starts_at"
                >
                  {{ formatDate(event.starts_at) }}
                </time>
                <p class="text-on-surface-variant">
                  {{ event.location || 'Lokasi belum diatur' }}
                </p>
              </div>

              <div class="flex items-center gap-3">
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-download"
                  @click="exportCSV"
                >
                  Ekspor CSV
                </UButton>
                <UButton
                  :to="`/e/${event.slug}`"
                  color="primary"
                  variant="soft"
                  icon="i-lucide-external-link"
                >
                  Halaman Publik
                </UButton>
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-pencil"
                  :to="`/e/${event.slug}/edit`"
                >
                  Edit Acara
                </UButton>
              </div>
            </div>

            <UCard class="border-outline" :ui="{ body: 'p-0 sm:p-0' }">
              <template #header>
                <div
                  class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <h2 class="text-lg font-bold text-on-surface">
                      Peserta Terdaftar ({{ attendees?.length || 0 }})
                    </h2>
                  </div>
                  <div class="w-full sm:w-72">
                    <UInput
                      v-model="attendeeSearch"
                      placeholder="Cari berdasarkan nama, email, organisasi..."
                      icon="i-lucide-search"
                      size="sm"
                      class="w-full"
                    />
                  </div>
                </div>
              </template>

              <div class="overflow-x-auto">
                <table class="w-full text-left">
                  <thead
                    class="bg-surface-container border-b border-outline text-xs font-semibold text-on-surface-variant uppercase"
                  >
                    <tr>
                      <th class="px-6 py-3">Nama Peserta</th>
                      <th class="px-6 py-3">Email</th>
                      <th class="px-6 py-3">Organisasi / Catatan</th>
                      <th class="px-6 py-3">Status</th>
                      <th class="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline">
                    <tr
                      v-for="att in filteredAttendees"
                      :key="att.id"
                      class="hover:bg-surface-container/50"
                    >
                      <td class="px-6 py-4 font-medium text-on-surface">
                        {{ att.name }}
                      </td>
                      <td
                        class="px-6 py-4 text-on-surface-variant font-mono text-xs"
                      >
                        {{ att.email || '-' }}
                      </td>
                      <td
                        class="px-6 py-4 text-on-surface-variant max-w-xs truncate"
                      >
                        {{ att.organization || '-' }}
                      </td>
                      <td class="px-6 py-4">
                        <UBadge
                          :color="att.is_attending ? 'primary' : 'neutral'"
                          variant="subtle"
                        >
                          {{
                            att.is_attending ? 'Terkonfirmasi' : 'Dibatalkan'
                          }}
                        </UBadge>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <UButton
                          size="xs"
                          color="error"
                          variant="ghost"
                          icon="i-lucide-trash-2"
                          title="Hapus peserta"
                          @click="removeAttendee(att.id)"
                        />
                      </td>
                    </tr>
                    <tr v-if="filteredAttendees.length === 0">
                      <td
                        colspan="5"
                        class="px-6 py-8 text-center text-on-surface-variant"
                      >
                        Tidak ada peserta yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </UCard>
          </section>

          <section v-else-if="item.value === 'registrasi'" class="space-y-6">
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-ticket" class="w-5 h-5" />
                  <h2 class="text-lg font-bold text-on-surface">
                    Batas Pendaftaran
                  </h2>
                </div>
              </template>

              <article class="space-y-4">
                <div
                  class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <h3 class="font-semibold text-on-surface">
                      Batas maksimal peserta
                    </h3>
                    <p class="text-on-surface-variant">
                      Batas registrasi saat ini
                      {{
                        !eventLimitFormState.enabled
                          ? 'mati.'
                          : `maksimal ${eventLimitFormState.value} peserta`
                      }}
                    </p>
                  </div>

                  <UModal title="Atur Batas Pendaftaran">
                    <UButton
                      type="button"
                      color="primary"
                      icon="i-lucide-settings-2"
                    >
                      Atur Batas
                    </UButton>
                    <template #body>
                      <UAlert
                        v-if="registrationAlert"
                        :title="registrationAlert.title"
                        :description="registrationAlert.message"
                        :icon="
                          registrationAlert.type === 'success'
                            ? 'i-lucide-check-circle'
                            : 'i-lucide-alert-circle'
                        "
                        :color="registrationAlert.type"
                        class="mb-4"
                        variant="subtle"
                        close
                        @update:open="
                          (open) =>
                            (registrationAlert = !open
                              ? null
                              : registrationAlert)
                        "
                      />
                      <UForm
                        class="space-y-4"
                        :schema="eventLimitFormSchema"
                        :state="eventLimitFormState"
                        @submit="(e) => saveRegistrationLimit(event.id, e)"
                      >
                        <UFormField
                          class="flex items-center justify-between"
                          label="Aktifkan batas pendaftaran"
                        >
                          <USwitch
                            v-model="eventLimitFormState.enabled"
                            size="sm"
                          />
                        </UFormField>

                        <UFormField
                          v-show="eventLimitFormState.enabled"
                          label="Batas maksimal pendaftar"
                          hint="Minimal 1 peserta"
                        >
                          <UInputNumber
                            v-model="eventLimitFormState.value"
                            :min="1"
                            class="w-full"
                          />
                        </UFormField>

                        <UButton
                          type="submit"
                          color="primary"
                          :loading="isSavingRegistration"
                        >
                          Simpan
                        </UButton>
                      </UForm>
                    </template>
                  </UModal>
                </div>
              </article>
            </UCard>

            <UCard>
              <template #header>
                <header class="flex items-center justify-between">
                  <h2 class="text-lg font-bold">Tiket</h2>
                  <UButton
                    variant="outline"
                    label="Buat tipe tiket baru"
                    icon="i-lucide-plus"
                    @click="isTicketTypeModalOpen = true"
                  />
                </header>
              </template>

              <p v-if="ticketTypes.length === 0" class="text-on-surface">
                Belum ada tiket.
              </p>

              <div v-else class="overflow-x-auto">
                <table class="w-full text-left">
                  <thead
                    class="bg-surface-container border-b border-outline text-xs font-semibold text-on-surface-variant uppercase"
                  >
                    <tr>
                      <th class="px-6 py-3">Nama Tiket</th>
                      <th class="px-6 py-3">Tipe</th>
                      <th class="px-6 py-3">Harga</th>
                      <th class="px-6 py-3">Kapasitas</th>
                      <th class="px-6 py-3">Jumlah</th>
                      <th class="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline">
                    <tr
                      v-for="ticket in ticketTypes"
                      :key="ticket.id"
                      class="hover:bg-surface-container/50"
                    >
                      <td class="px-6 py-4 font-medium text-on-surface">
                        {{ ticket.name }}
                        <span
                          v-if="ticket.description"
                          class="block text-xs font-normal text-on-surface-variant"
                        >
                          {{ ticket.description }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-on-surface-variant">
                        {{ ticketTypeKindLabels[ticket.kind] }}
                      </td>
                      <td
                        class="px-6 py-4 text-on-surface-variant font-mono text-xs"
                      >
                        {{ formatRupiah(ticket.price) }}
                      </td>
                      <td class="px-6 py-4 text-on-surface-variant">
                        {{ ticket.capacity ?? '∞' }}
                      </td>
                      <td class="px-6 py-4 text-on-surface-variant">
                        {{ ticket.min_qty }}–{{ ticket.max_qty }} (×{{
                          ticket.multiple_of
                        }})
                      </td>
                      <td class="px-6 py-4">
                        <UBadge
                          :color="ticket.is_active ? 'primary' : 'neutral'"
                          variant="subtle"
                        >
                          {{ ticket.is_active ? 'Aktif' : 'Disembunyikan' }}
                        </UBadge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <UModal
                v-model:open="isTicketTypeModalOpen"
                title="Buat tipe tiket baru"
              >
                <template #body>
                  <UAlert
                    v-if="ticketTypeError"
                    title="Ada kesalahan!"
                    :description="ticketTypeError"
                    color="error"
                    icon="i-lucide-triangle-alert"
                    variant="subtle"
                    class="mb-4"
                  />

                  <UForm
                    class="space-y-4"
                    :schema="ticketTypeFormSchema"
                    :state="ticketTypeFormState"
                    @submit="handleAddTicketType"
                  >
                    <UFormField label="Nama tiket" name="name">
                      <UInput
                        v-model="ticketTypeFormState.name"
                        type="text"
                        name="name"
                        class="w-full"
                        required
                      />
                    </UFormField>

                    <UFormField
                      label="Deskripsi"
                      name="description"
                      hint="opsional"
                    >
                      <UInput
                        v-model="ticketTypeFormState.description"
                        type="text"
                        name="description"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Tipe tiket" name="kind">
                      <USelect
                        v-model="ticketTypeFormState.kind"
                        name="kind"
                        :items="[
                          { label: 'Single (1 orang)', value: 'single' },
                          { label: 'Couple (2 orang)', value: 'couple' },
                          { label: 'Berempat (4 orang)', value: 'berempat' },
                        ]"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Harga" name="price" required>
                      <UInput
                        v-model="ticketTypeFormState.price"
                        type="number"
                        name="price"
                        class="w-full"
                        :min="0"
                      />
                    </UFormField>

                    <UFormField
                      label="Kapasitas"
                      name="capacity"
                      hint="default: tak terbatas"
                    >
                      <UInput
                        v-model="ticketTypeFormState.capacity"
                        type="number"
                        name="capacity"
                        class="w-full"
                        placeholder="∞"
                      />
                    </UFormField>

                    <div class="grid gap-4 sm:grid-cols-3">
                      <UFormField
                        label="Jumlah minimal"
                        name="min_qty"
                        required
                      >
                        <UInput
                          v-model="ticketTypeFormState.min_qty"
                          type="number"
                          name="min_qty"
                          class="w-full"
                          :min="1"
                        />
                      </UFormField>

                      <UFormField
                        label="Jumlah maksimal"
                        name="max_qty"
                        required
                      >
                        <UInput
                          v-model="ticketTypeFormState.max_qty"
                          type="number"
                          name="max_qty"
                          class="w-full"
                          :min="1"
                        />
                      </UFormField>

                      <UFormField label="Kelipatan" name="multiple_of" required>
                        <UInput
                          v-model="ticketTypeFormState.multiple_of"
                          type="number"
                          name="multiple_of"
                          class="w-full"
                          :min="1"
                        />
                      </UFormField>
                    </div>

                    <UFormField
                      label="Tampilkan di halaman acara"
                      name="is_active"
                      orientation="horizontal"
                    >
                      <USwitch
                        uncheckedIcon="i-lucide-x"
                        checkedIcon="i-lucide-check"
                        v-model="ticketTypeFormState.is_active"
                        name="is_active"
                      />
                    </UFormField>

                    <UButton
                      type="submit"
                      label="Simpan"
                      :loading="isSavingTicketType"
                    />
                  </UForm>
                </template>
              </UModal>
            </UCard>
          </section>

          <section v-else-if="item.value === 'more'" class="space-y-6">
            <UCard>
              <template #header>
                <div class="flex items-center gap-2 text-error">
                  <UIcon name="i-lucide-alert-triangle" class="w-5 h-5" />
                  <h2 class="text-lg font-bold">Zona Bahaya</h2>
                </div>
              </template>

              <article
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 class="font-semibold text-on-surface">Hapus Acara Ini</h3>
                  <p class="text-on-surface-variant">
                    Acara ini akan dihapus dari daftar publik dan dasbor Anda.
                    Tindakan ini dapat dibatalkan hanya oleh administrator
                    sistem.
                  </p>
                </div>

                <UModal
                  title="Hapus Acara"
                  :description="`Apakah Anda yakin ingin menghapus acara '${event.title}'? Acara ini tidak akan lagi ditampilkan kepada publik.`"
                >
                  <UButton
                    variant="outline"
                    color="error"
                    icon="i-lucide-trash-2"
                  >
                    Hapus Acara
                  </UButton>

                  <template #footer>
                    <div class="flex w-full justify-end gap-2">
                      <UButton color="neutral" variant="ghost">Batal</UButton>
                      <UButton
                        color="error"
                        icon="i-lucide-trash-2"
                        :loading="isDeletingEvent"
                        @click="() => handleDeleteEvent(event)"
                      >
                        Ya, Hapus Acara
                      </UButton>
                    </div>
                  </template>
                </UModal>
              </article>
            </UCard>
          </section>
        </template>
      </UTabs>
    </template>
  </div>
</template>
