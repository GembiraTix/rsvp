<script setup lang="ts">
import { z } from 'zod'
import { useEvents } from '@/composables/useEvents'
import { useTicketTypes } from '@/composables/useTicketTypes'
import { useTicketCart } from '@/composables/useTicketCart'
import {
  useAttendeeDraft,
  type AttendeeDraft,
  type OrdererDraft,
} from '@/composables/useAttendeeDraft'
import { useUserProfile } from '@/composables/useUserProfile'
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

const { fetchProfile } = useUserProfile()
const { data: profileRes } = await fetchProfile()
const profile = computed(() => profileRes.value?.data || null)

const { fetchPublicByEvent } = useTicketTypes()
const { data: ticketTypesRes } = await fetchPublicByEvent(eventSlug)
const ticketTypes = computed(() => ticketTypesRes.value?.data ?? [])

const { cart, selectedLines, encode, decode } = useTicketCart(ticketTypes)

const { load: loadDraft, save: saveDraft } = useAttendeeDraft(eventSlug)

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

const ordererSchema = attendeeSchema.omit({ gender: true })

const outerSchema = z.object({
  orderer: ordererSchema,
  attendees: z.array(z.unknown()),
})

const state = reactive<{ orderer: OrdererDraft; attendees: AttendeeDraft[] }>({
  orderer: { name: '', identityType: '', identityNumber: '', email: '', whatsapp: '' },
  attendees: [],
})

const sameAsOrderer = ref<boolean[]>([])

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

// Decoded in setup so SSR renders the real cart instead of an empty state.
const cartInvalid = ref(false)
try {
  cart.value = decode(route.query.cart as string)
} catch {
  cart.value = []
  cartInvalid.value = true
}

onMounted(() => {
  if (cartInvalid.value || selectedLines.value.length === 0) {
    goBackToTickets()
    return
  }

  const previous = loadDraft()

  state.orderer = {
    name: previous.orderer.name || profile.value?.name || '',
    email: previous.orderer.email || profile.value?.email || '',
    identityType: previous.orderer.identityType,
    identityNumber: previous.orderer.identityNumber,
    whatsapp: previous.orderer.whatsapp,
  }

  const attendees: AttendeeDraft[] = []

  for (const line of selectedLines.value) {
    const lineUnits = previous.attendees.filter(
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
  sameAsOrderer.value = attendees.map(() => false)
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

function toggleSameAsOrderer(index: number, value: boolean) {
  sameAsOrderer.value[index] = value
  if (!value) return

  const unit = state.attendees[index]
  if (!unit) return
  unit.name = state.orderer.name
  unit.identityType = state.orderer.identityType
  unit.identityNumber = state.orderer.identityNumber
  unit.email = state.orderer.email
  unit.whatsapp = state.orderer.whatsapp
}

function handleContinue() {
  saveDraft({ orderer: state.orderer, attendees: state.attendees })
  navigateTo(
    `/e/${eventSlug.value}/checkout?cart=${encode(selectedLines.value)}`,
  )
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
      <h3 class="text-lg font-semibold text-on-surface">Data Pemesan</h3>

      <UCard>
        <div class="grid sm:grid-cols-2 gap-4">
          <UFormField
            label="Nama Lengkap"
            name="orderer.name"
            class="sm:col-span-2"
          >
            <UInput
              v-model="state.orderer.name"
              placeholder="Nama sesuai identitas"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Tipe Identitas" name="orderer.identityType">
            <USelect
              v-model="state.orderer.identityType"
              :items="identityTypeItems"
              placeholder="Pilih tipe"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Nomor Identitas" name="orderer.identityNumber">
            <UInput
              v-model="state.orderer.identityNumber"
              placeholder="Nomor KTP/SIM/paspor"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Email" name="orderer.email">
            <UInput
              v-model="state.orderer.email"
              type="email"
              placeholder="nama@email.com"
              class="w-full"
            />
          </UFormField>

          <UFormField label="No. WhatsApp" name="orderer.whatsapp">
            <UInput
              v-model="state.orderer.whatsapp"
              type="tel"
              placeholder="08xxxxxxxxxx"
              class="w-full"
            />
          </UFormField>
        </div>
      </UCard>

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
              <div class="flex items-center justify-between gap-4">
                <p class="font-medium text-on-surface">
                  Peserta {{ count + 1 }}
                </p>
                <USwitch
                  :model-value="sameAsOrderer[count] ?? false"
                  label="Samakan dengan detail pemesan"
                  @update:model-value="toggleSameAsOrderer(count, $event)"
                />
              </div>
            </template>

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
          </UCard>
        </UForm>
      </template>

      <UButton
        type="submit"
        color="primary"
        size="lg"
        block
        :disabled="state.attendees.length === 0"
      >
        Lanjut ke Pembayaran
      </UButton>
    </UForm>
  </div>
</template>
