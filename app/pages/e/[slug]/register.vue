<script setup lang="ts">
import { z } from 'zod'
import { useEvents } from '@/composables/useEvents'
import { useTicketTypes } from '@/composables/useTicketTypes'
import { useTicketCart } from '@/composables/useTicketCart'
import {
  useAttendeeDraft,
  type AttendeeDraft,
} from '@/composables/useAttendeeDraft'
import { isValidWhatsapp } from '~~/shared/utils/whatsapp'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const eventSlug = computed(() => route.params.slug as string)

const { fetchBySlug } = useEvents()

const { data: eventRes, error: eventError } = await fetchBySlug(eventSlug)

if (eventError.value || !eventRes.value?.data) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Acara tidak ditemukan',
  })
}
const event = computed(() => eventRes.value!.data)

useSeoMeta({
  title: () => `${event.value?.title || 'Acara'} - Data Peserta`,
})

const { fetchPublicByEvent } = useTicketTypes()
const { data: ticketTypesRes } = await fetchPublicByEvent(eventSlug)
const ticketTypes = computed(() => ticketTypesRes.value?.data ?? [])

const { cart, selectedLines, encode, decode } = useTicketCart(ticketTypes)

const { load: loadDraft, save: saveDraft } = useAttendeeDraft(eventSlug)

const outerSchema = z.object({
  attendees: z.array(z.unknown()),
})

const attendeeSchema = z.object({
  name: z.string().trim().min(1, 'Nama lengkap wajib diisi.'),
  identityType: z
    .string()
    .refine(
      (v) => ['ktp', 'sim', 'paspor', 'kartu_pelajar'].includes(v),
      'Pilih tipe identitas.',
    ),
  identityNumber: z.string().trim().min(1, 'Nomor identitas wajib diisi.'),
  email: z.email('Masukkan alamat email yang valid.'),
  whatsapp: z.string().refine(isValidWhatsapp, 'Nomor WhatsApp tidak valid.'),
  gender: z
    .string()
    .refine(
      (v) => v === 'laki-laki' || v === 'perempuan',
      'Pilih jenis kelamin.',
    ),
})

const state = reactive<{ attendees: AttendeeDraft[] }>({ attendees: [] })

const isLoading = ref(false)
const submitError = ref('')
const registeredEmails = ref<string[]>([])

const identityTypeItems = [
  { label: 'KTP', value: 'ktp' },
  { label: 'SIM', value: 'sim' },
  { label: 'Paspor', value: 'paspor' },
  { label: 'Kartu Pelajar', value: 'kartu_pelajar' },
]

const genderItems = [
  { label: 'Laki-laki', value: 'laki-laki' },
  { label: 'Perempuan', value: 'perempuan' },
]

onMounted(() => {
  try {
    cart.value = decode(route.query.cart as string)
  } catch {
    goBackToTickets()
    return
  }

  if (selectedLines.value.length === 0) {
    goBackToTickets()
    return
  }

  const previous = loadDraft()
  const attendees: AttendeeDraft[] = []

  for (const line of selectedLines.value) {
    const lineUnits = previous.filter(
      (u) => u.ticketTypeId === line.ticketType.id,
    )
    for (let i = 0; i < line.qty; i += 1) {
      const prev = lineUnits[i]
      attendees.push({
        ticketTypeId: line.ticketType.id,
        name: prev?.name ?? '',
        identityType: prev?.identityType ?? '',
        identityNumber: prev?.identityNumber ?? '',
        email: prev?.email ?? '',
        whatsapp: prev?.whatsapp ?? '',
        gender: prev?.gender ?? '',
      })
    }
  }

  state.attendees = attendees
})

function goBackToTickets() {
  navigateTo(`/e/${eventSlug.value}/tickets`)
}

function unitHeaderLabel(index: number): string | null {
  const unit = state.attendees[index]
  if (!unit) return null

  const isFirstOfLine =
    index === 0 ||
    state.attendees[index - 1]?.ticketTypeId !== unit.ticketTypeId
  if (!isFirstOfLine) return null

  return ticketTypes.value.find((t) => t.id === unit.ticketTypeId)?.name ?? null
}

const duplicateEmails = computed(() => {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const unit of state.attendees) {
    const email = unit.email.trim().toLowerCase()
    if (!email) continue
    if (seen.has(email)) {
      duplicates.add(email)
    } else {
      seen.add(email)
    }
  }

  return duplicates
})

function emailFlag(unit: AttendeeDraft): 'duplicate' | 'registered' | null {
  const email = unit.email.trim().toLowerCase()
  if (!email) return null
  if (duplicateEmails.value.has(email)) return 'duplicate'
  if (registeredEmails.value.some((e) => e.toLowerCase() === email)) {
    return 'registered'
  }
  return null
}

async function handleContinue() {
  submitError.value = ''

  if (duplicateEmails.value.size > 0) {
    submitError.value = 'Email peserta tidak boleh duplikat dalam satu pesanan.'
    return
  }

  isLoading.value = true

  try {
    const res = await $fetch<{
      success: boolean
      data: { registered: string[] }
    }>('/api/registrations/check', {
      method: 'POST',
      body: {
        eventId: event.value.id,
        emails: state.attendees.map((u) => u.email.trim()),
      },
    })

    registeredEmails.value = res.data.registered
    if (res.data.registered.length > 0) {
      submitError.value =
        'Beberapa peserta sudah terdaftar untuk acara ini. Ubah data peserta yang ditandai.'
      return
    }

    saveDraft(state.attendees)
    navigateTo(
      `/e/${eventSlug.value}/checkout?cart=${encode(selectedLines.value)}`,
    )
  } catch (err: unknown) {
    submitError.value = getErrorMessage(
      err,
      'Gagal memeriksa data peserta. Silakan coba lagi.',
    )
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="py-8 max-w-5xl mx-auto px-4 space-y-8">
    <PageHeader
      :back-to="`/e/${event.slug}/tickets`"
      back-label="Kembali ke pemilihan tiket"
      title="Data Peserta"
      :description="event.title"
    />

    <UAlert
      v-if="submitError"
      color="error"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :description="submitError"
    />

    <UAlert
      v-if="state.attendees.length === 0"
      color="warning"
      variant="subtle"
      icon="i-lucide-info"
      description="Belum ada tiket yang dipilih."
    />

    <UForm
      :state="state"
      :schema="outerSchema"
      class="space-y-6"
      @submit="handleContinue"
    >
      <template v-for="(unit, count) in state.attendees" :key="count">
        <h3
          v-if="unitHeaderLabel(count)"
          class="text-lg font-semibold text-on-surface"
        >
          {{ unitHeaderLabel(count) }}
        </h3>

        <UForm :name="`attendees.${count}`" :schema="attendeeSchema" nested>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <p class="font-medium text-on-surface">
                  Peserta {{ count + 1 }}
                </p>
              </div>
            </template>

            <div class="space-y-4">
              <UAlert
                v-if="emailFlag(unit) === 'duplicate'"
                color="warning"
                variant="subtle"
                icon="i-lucide-users"
                description="Email ini dipakai peserta lain di pesanan yang sama."
              />

              <UAlert
                v-else-if="emailFlag(unit) === 'registered'"
                color="error"
                variant="subtle"
                icon="i-lucide-user-check"
                description="Email ini sudah terdaftar untuk acara ini. Ubah data peserta ini atau ubah tiket yang dipesan."
              />

              <div class="grid sm:grid-cols-2 gap-4">
                <UFormField
                  label="Nama Lengkap"
                  name="name"
                  class="sm:col-span-2"
                >
                  <UInput
                    v-model="unit.name"
                    placeholder="Nama sesuai identitas"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Tipe Identitas" name="identityType">
                  <USelect
                    v-model="unit.identityType"
                    :items="identityTypeItems"
                    placeholder="Pilih tipe"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Nomor Identitas" name="identityNumber">
                  <UInput
                    v-model="unit.identityNumber"
                    placeholder="Nomor KTP/SIM/paspor"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Email" name="email">
                  <UInput
                    v-model="unit.email"
                    type="email"
                    placeholder="nama@email.com"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="No. WhatsApp" name="whatsapp">
                  <UInput
                    v-model="unit.whatsapp"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Jenis Kelamin" name="gender">
                  <USelect
                    v-model="unit.gender"
                    :items="genderItems"
                    placeholder="Pilih jenis kelamin"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>
          </UCard>
        </UForm>
      </template>

      <UButton
        type="submit"
        color="primary"
        size="lg"
        block
        :loading="isLoading"
        :disabled="state.attendees.length === 0"
      >
        Lanjut ke Pembayaran
      </UButton>
    </UForm>
  </div>
</template>
