<script setup lang="ts">
import { useEvents } from '@/composables/useEvents'
import { useUserProfile } from '@/composables/useUserProfile'
import { useTicketTypes } from '@/composables/useTicketTypes'
import { useTicketCategories } from '@/composables/useTicketCategories'
import { useAttendees } from '@/composables/useAttendees'
import { useTabQuery } from '@/composables/useTabQuery'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import type { Event, Rsvp, TicketType } from '~~/server/domain/types'
import { z } from 'zod'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
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
    {
      label: 'More',
      value: 'more',
      icon: 'i-lucide-settings-2',
    },
  ]

  return items
})

const selectedTab = useTabQuery('overview')

const {
  fetchBySlug,
  updateRegistrationLimit: apiUpdateRegistrationLimit,
  updateDraftStatus,
  deleteEvent: apiDeleteEvent,
} = useEvents()
const { data: eventRes, error: eventError } = await fetchBySlug(eventSlug)

if (eventError.value || !eventRes.value?.data) {
  throw createError({ statusCode: 404, statusMessage: 'Acara tidak ditemukan' })
}

const event = computed(() => eventRes.value!.data)

const isSavingRegistration = ref(false)

const { fetchProfile } = useUserProfile()
const { data: profileRes } = await fetchProfile()
const isSuperAdmin = computed(
  () => profileRes.value?.data.role === 'super_admin',
)

const eventLimitFormSchema = z.object({
  enabled: z.boolean().default(false),
  value: z.number().positive('batas registrasi harus positif.'),
})

type EventLimitFormSchema = z.output<typeof eventLimitFormSchema>
const eventLimitFormState = ref<EventLimitFormSchema>({
  enabled: event.value?.registration_limit != null,
  value: event.value?.registration_limit ?? 1,
})

const registrationAlert = ref<{
  title: string
  type: 'success' | 'error'
  message: string
} | null>(null)

async function saveRegistrationLimit(
  eventId: number,
  { data }: FormSubmitEvent<EventLimitFormSchema>,
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
      message: 'Batas registrasi berhasil disimpan.',
    }
  } catch (err: unknown) {
    registrationAlert.value = {
      title: 'Gagal',
      type: 'error',
      message:
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan batas registrasi.',
    }
  } finally {
    isSavingRegistration.value = false
  }
}

const isUpdatingDraftStatus = ref(false)
const draftFormState = reactive({ isDraft: event.value.is_draft })

async function handleSetEventDraft(state: { isDraft: boolean }) {
  isUpdatingDraftStatus.value = true
  try {
    await updateDraftStatus(event.value.id, state.isDraft)
  } catch (err: unknown) {
    console.log(err)
  } finally {
    isUpdatingDraftStatus.value = false
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
const { fetchByEvent, removeAttendee: apiRemoveAttendee } = useAttendees()
const { data: attendeesRes, refresh: refreshAttendees } =
  await fetchByEvent(eventSlug)
const attendees = computed(() => attendeesRes.value?.data ?? [])

const attendeeErrorMessage = ref('')

async function removeAttendee(id: number) {
  if (!confirm('Hapus peserta ini dari daftar RSVP?')) return
  attendeeErrorMessage.value = ''
  try {
    await apiRemoveAttendee(eventSlug.value, id)
    await refreshAttendees()
  } catch (err: unknown) {
    attendeeErrorMessage.value = getErrorMessage(
      err,
      'Gagal menghapus peserta.',
    )
  }
}

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
      (a.custom_question_answer &&
        a.custom_question_answer.toLowerCase().includes(q)) ||
      (a.whatsapp && a.whatsapp.includes(q)) ||
      (a.identity_number && a.identity_number.toLowerCase().includes(q)),
  )
})

const attendeesColumns: TableColumn<Rsvp>[] = [
  {
    accessorKey: 'name',
    header: 'Nama',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  ...(event.value?.custom_question_label
    ? [
        {
          accessorKey: 'custom_question_answer',
          header: event.value.custom_question_label,
        },
      ]
    : []),
  {
    accessorKey: 'whatsapp',
    header: 'WhatsApp',
  },
  {
    id: 'identity',
    header: 'Identitas',
  },
  {
    accessorKey: 'gender',
    header: 'Jenis Kelamin',
  },
  { id: 'action', header: 'Aksi' },
]

function csvEscape(value: string | number | boolean): string {
  let str = String(value)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }
  return /[",\n\r]/.test(str) ? `"${str.replaceAll('"', '""')}"` : str
}

function exportCSV() {
  if (!attendees.value || !event.value) return
  const customLabel = event.value.custom_question_label
  const headers = [
    'ID',
    'Nama',
    'Email',
    ...(customLabel ? [customLabel] : []),
    'WhatsApp',
    'Tipe Identitas',
    'Nomor Identitas',
    'Jenis Kelamin',
    'Tanggal RSVP',
    'Hadir',
  ]
  const rows = attendees.value.map((a) => [
    a.id,
    a.name,
    a.email || '',
    ...(customLabel ? [a.custom_question_answer || ''] : []),
    a.whatsapp || '',
    a.identity_type || '',
    a.identity_number || '',
    a.gender || '',
    a.created_at,
    a.is_attending,
  ])
  const lines = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n')
  const blob = new Blob([lines], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `peserta-${event.value.slug}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const { fetchByEvent: fetchTicketTypes, deleteTicketType } = useTicketTypes()
const { data: ticketTypesRes, refresh: refreshTicketTypes } =
  await fetchTicketTypes(eventSlug)

const ticketTypes = computed(() => ticketTypesRes.value?.data ?? [])

const isTicketTypeModalOpen = ref(false)
const editingTicketType = ref<TicketType | null>(null)
const ticketTypeToDelete = ref<TicketType | null>(null)
const isDeleteTicketTypeModalOpen = ref(false)
const isDeletingTicketType = ref(false)
const ticketTypeNotice = ref('')
const ticketTypeError = ref('')

function openCreateTicketTypeModal() {
  editingTicketType.value = null
  isTicketTypeModalOpen.value = true
}

function openEditTicketTypeModal(ticket: TicketType) {
  editingTicketType.value = ticket
  isTicketTypeModalOpen.value = true
}

function askDeleteTicketType(ticket: TicketType) {
  ticketTypeToDelete.value = ticket
  ticketTypeError.value = ''
  isDeleteTicketTypeModalOpen.value = true
}

function handleTicketTypeSaved(notice: string) {
  ticketTypeNotice.value = notice
  refreshTicketTypes()
}

async function handleDeleteTicketType() {
  const ticket = ticketTypeToDelete.value
  if (!ticket) return

  isDeletingTicketType.value = true
  ticketTypeError.value = ''

  try {
    const res = await deleteTicketType(event.value.id, ticket.id)

    await refreshTicketTypes()
    isDeleteTicketTypeModalOpen.value = false
    ticketTypeToDelete.value = null
    ticketTypeNotice.value = res.data.deactivated
      ? `Tipe tiket '${ticket.name}' sudah pernah terjual, tipe tiket akan dinonaktifkan.`
      : `Tipe tiket '${ticket.name}' berhasil dihapus.`
  } catch (err: unknown) {
    ticketTypeError.value = getErrorMessage(
      err,
      'Gagal menghapus tipe tiket. Silakan coba lagi.',
    )
  } finally {
    isDeletingTicketType.value = false
  }
}

const { fetchAll: fetchTicketCategories } = useTicketCategories()
const { data: ticketCategoriesRes } = await fetchTicketCategories()

const categoryNameById = computed(() => {
  const map = new Map<number, string>()
  for (const category of ticketCategoriesRes.value?.data ?? []) {
    map.set(category.id, category.name)
  }
  return map
})

const ticketTypeColumns: TableColumn<TicketType>[] = [
  {
    accessorKey: 'name',
    header: 'Nama Tiket',
  },
  {
    id: 'category',
    header: 'Kategori',
    cell: ({ row }) =>
      categoryNameById.value.get(row.original.category_id) ?? 'Reguler',
  },
  {
    accessorKey: 'price',
    header: 'Harga',
    cell: ({ row }) => formatRupiah(row.original.price),
  },
  {
    accessorKey: 'capacity',
    header: 'Kapasitas',
    cell: ({ row }) => row.original.capacity ?? '∞',
  },
  {
    id: 'qty',
    header: 'Jumlah',
    cell: ({ row }) =>
      `${row.original.min_qty}–${row.original.max_qty} (×${row.original.multiple_of})`,
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
  },
  {
    id: 'action',
    header: 'Aksi',
  },
]
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
                <EventInfoPanel :event="event" />
              </div>

              <div class="flex items-center gap-3">
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

            <UCard
              class="border-outline"
              :ui="{
                body: 'p-0 sm:p-0',
                header:
                  'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
              }"
            >
              <template #header>
                <h2 class="flex-1 text-lg font-bold text-on-surface">
                  Peserta Terdaftar ({{ attendees.length }})
                </h2>
                <div class="flex flex-1 gap-4 sm:w-72">
                  <UInput
                    v-model="attendeeSearch"
                    placeholder="Cari berdasarkan nama, email, organisasi..."
                    icon="i-lucide-search"
                    class="w-full"
                  />

                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-download"
                    class="min-w-fit"
                    @click="exportCSV"
                  >
                    Ekspor CSV
                  </UButton>
                </div>
              </template>

              <UAlert
                v-if="attendeeErrorMessage"
                :title="attendeeErrorMessage"
                icon="i-lucide-alert-circle"
                color="error"
                variant="subtle"
                class="m-4"
                close
                @update:open="attendeeErrorMessage = ''"
              />

              <UTable :data="filteredAttendees" :columns="attendeesColumns">
                <template #identity-cell="{ row }">
                  {{
                    [row.original.identity_type, row.original.identity_number]
                      .filter(Boolean)
                      .join(' · ') || '-'
                  }}
                </template>
                <template #action-cell="{ row }">
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    title="Hapus peserta"
                    @click="removeAttendee(row.original.id)"
                  />
                </template>
              </UTable>
            </UCard>
          </section>

          <section v-else-if="item.value === 'registrasi'" class="space-y-6">
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-bold text-on-surface">
                    Batas Registrasi
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

                  <UModal title="Atur Batas Registrasi">
                    <UButton label="Atur Batas" icon="i-lucide-settings-2" />
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
                          label="Aktifkan batas registrasi"
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
                    @click="openCreateTicketTypeModal"
                  />
                </header>
              </template>

              <UAlert
                v-if="ticketTypeNotice"
                :title="ticketTypeNotice"
                color="success"
                icon="i-lucide-circle-check"
                variant="subtle"
                class="mb-4"
                close
                @update:open="ticketTypeNotice = ''"
              />

              <UTable
                v-if="ticketTypes.length > 0"
                :data="ticketTypes"
                :columns="ticketTypeColumns"
              >
                <template #name-cell="{ row }">
                  <span class="font-medium text-on-surface">
                    {{ row.original.name }}
                    <span
                      v-if="row.original.description"
                      class="block text-xs font-normal text-on-surface-variant"
                    >
                      {{ row.original.description }}
                    </span>
                  </span>
                </template>

                <template #is_active-cell="{ row }">
                  <UBadge
                    :color="row.original.is_active ? 'primary' : 'neutral'"
                    variant="subtle"
                  >
                    {{ row.original.is_active ? 'Aktif' : 'Disembunyikan' }}
                  </UBadge>
                </template>

                <template #action-cell="{ row }">
                  <div class="text-right">
                    <UButton
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-pencil"
                      title="Ubah tipe tiket"
                      @click="openEditTicketTypeModal(row.original)"
                    />
                    <UButton
                      size="xs"
                      color="error"
                      variant="ghost"
                      icon="i-lucide-trash-2"
                      title="Hapus tipe tiket"
                      @click="askDeleteTicketType(row.original)"
                    />
                  </div>
                </template>
              </UTable>

              <UEmpty
                v-else
                icon="i-lucide-ticket"
                title="Belum ada tiket."
                class="py-4"
              />

              <TicketTypeModal
                v-model:open="isTicketTypeModalOpen"
                :event-id="event.id"
                :ticket-type="editingTicketType"
                @saved="handleTicketTypeSaved"
              />

              <UModal
                v-model:open="isDeleteTicketTypeModalOpen"
                title="Hapus tipe tiket"
                :description="`Apakah Anda yakin ingin menghapus tipe tiket '${ticketTypeToDelete?.name}'? Tipe tiket yang sudah pernah terjual akan dinonaktifkan, bukan dihapus.`"
              >
                <template v-if="ticketTypeError" #body>
                  <UAlert
                    title="Ada kesalahan!"
                    :description="ticketTypeError"
                    color="error"
                    icon="i-lucide-triangle-alert"
                    variant="subtle"
                  />
                </template>

                <template #footer>
                  <div class="flex w-full justify-end gap-2">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      @click="isDeleteTicketTypeModalOpen = false"
                    >
                      Batal
                    </UButton>
                    <UButton
                      color="error"
                      icon="i-lucide-trash-2"
                      :loading="isDeletingTicketType"
                      @click="handleDeleteTicketType"
                    >
                      Ya, Hapus
                    </UButton>
                  </div>
                </template>
              </UModal>
            </UCard>
          </section>

          <section v-else-if="item.value === 'more'" class="space-y-6">
            <UCard>
              <template #header>
                <h2 class="text-lg font-bold">Pengaturan</h2>
              </template>

              <article
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 class="font-semibold text-on-surface">
                    Sembunyikan acara
                  </h3>
                  <p class="text-on-surface-variant">
                    Acara yang disembunyikan tidak akan ditampilkan ke pengguna.
                  </p>
                </div>

                <UModal
                  title="Ubah status draf"
                  description="Acara disembunyikan tidak akan ditampilkan ke pengguna."
                >
                  <UButton
                    label="Ubah status draf"
                    icon="i-lucide-settings-2"
                  />

                  <template #body>
                    <UForm
                      class="space-y-4"
                      @submit="() => handleSetEventDraft(draftFormState)"
                    >
                      <UFormField
                        size="lg"
                        label="sembunyikan acara"
                        :description="
                          !draftFormState.isDraft
                            ? 'anda akan menampilkan acara ini untuk pengguna.'
                            : undefined
                        "
                        orientation="horizontal"
                      >
                        <USwitch v-model="draftFormState.isDraft" />
                      </UFormField>

                      <UButton
                        type="submit"
                        label="Simpan"
                        :loading="isUpdatingDraftStatus"
                      />
                    </UForm>
                  </template>
                </UModal>
              </article>
            </UCard>

            <UCard v-if="isSuperAdmin">
              <template #header>
                <h2 class="text-lg text-error font-bold">Zona Bahaya</h2>
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
