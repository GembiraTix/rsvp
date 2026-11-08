<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useRsvp } from '@/composables/useRsvp'
import type { UserProfile } from '~~/server/domain/types'
import { isValidWhatsapp, normalizeWhatsapp } from '~~/shared/utils/whatsapp'

const props = defineProps<{
  eventId: number
  eventTitle: string | null
  mode: 'guest' | 'authenticated'
  profile: UserProfile | null
  customQuestionLabel?: string | null
  customQuestionRequired?: boolean
}>()

const emit = defineEmits<{ registered: [token: string] }>()

const { submit } = useRsvp()

const isSubmitting = ref(false)
const errorMessage = ref('')
const isConfirmOpen = ref(false)
const submitResult = ref<{ token: string; emailSent: boolean } | null>(null)

const identityTypes = ['ktp', 'sim', 'paspor', 'kartu_pelajar'] as const
const genders = ['laki-laki', 'perempuan'] as const

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

const formSchema = z.object({
  name: z.string().trim().min(1, 'Nama lengkap wajib diisi.'),
  email: z.email('Masukkan alamat email yang valid.'),
  customQuestionAnswer:
    props.customQuestionLabel && props.customQuestionRequired
      ? z.string().trim().min(1, `${props.customQuestionLabel} wajib diisi.`)
      : z.string().optional(),
  identityType: z
    .string()
    .refine(
      (v) => !v || identityTypes.includes(v as (typeof identityTypes)[number]),
      'Pilih tipe identitas.',
    )
    .optional(),
  identityNumber: z.string().optional(),
  whatsapp: z
    .string()
    .refine(
      (v) => !v || isValidWhatsapp(normalizeWhatsapp(v)),
      'Nomor WhatsApp tidak valid.',
    )
    .optional(),
  gender: z
    .string()
    .refine(
      (v) => !v || genders.includes(v as (typeof genders)[number]),
      'Pilih jenis kelamin.',
    )
    .optional(),
})

type RsvpForm = z.output<typeof formSchema>

const form = reactive<RsvpForm>({
  name: props.mode === 'authenticated' ? props.profile?.name || '' : '',
  email: props.mode === 'authenticated' ? props.profile?.email || '' : '',
  customQuestionAnswer: '',
  identityType: undefined,
  identityNumber: '',
  whatsapp: '',
  gender: undefined,
})

async function submitRsvp(values: RsvpForm) {
  errorMessage.value = ''
  submitResult.value = null
  isSubmitting.value = true

  try {
    const res = await submit({
      eventId: props.eventId,
      name: values.name,
      email: values.email,
      customQuestionAnswer: values.customQuestionAnswer || undefined,
      identityType: values.identityType || undefined,
      identityNumber: values.identityNumber || undefined,
      whatsapp: values.whatsapp || undefined,
      gender: values.gender || undefined,
    })
    submitResult.value = { token: res.token, emailSent: res.emailSent }
    emit('registered', res.token)
  } catch (err: unknown) {
    errorMessage.value = getErrorMessage(
      err,
      'Gagal mengirim RSVP. Silakan coba lagi.',
    )
  } finally {
    isSubmitting.value = false
  }
}

async function handleGuestRsvp(e: FormSubmitEvent<RsvpForm>) {
  await submitRsvp(e.data)
}

async function handleAuthenticatedRsvp(e: FormSubmitEvent<RsvpForm>) {
  isConfirmOpen.value = false
  await submitRsvp(e.data)
}
</script>

<template>
  <template v-if="mode === 'authenticated'">
    <header class="space-y-1">
      <h2 class="text-xl font-bold text-on-surface">RSVP Cepat</h2>
      <p class="text-on-surface-variant">
        Masuk sebagai
        <strong class="text-on-surface">{{ profile?.email }}</strong>
      </p>
    </header>

    <UAlert
      v-if="errorMessage"
      title="ada kesalahan!"
      :description="errorMessage"
      icon="i-lucide-triangle-alert"
      color="error"
      variant="subtle"
    />

    <UAlert
      v-if="submitResult"
      :icon="
        submitResult.emailSent ? 'i-lucide-mail-check' : 'i-lucide-mail-warning'
      "
      :color="submitResult.emailSent ? 'success' : 'warning'"
      variant="subtle"
      :title="
        submitResult.emailSent
          ? 'Reservasi berhasil'
          : 'Email konfirmasi gagal dikirim'
      "
    >
      <template #description>
        <p v-if="submitResult.emailSent">
          Cek kotak masuk Anda untuk email konfirmasi.
        </p>
        <template v-else>
          <p>Gagal mengirim email konfirmasi.</p>
          <p>Jangan khawatir, reservasi anda tetap tercatat.</p>
        </template>

        <p>
          Simpan tautan tiket Anda:
          <NuxtLink
            :to="`/rsvp/${submitResult.token}`"
            class="text-primary font-medium underline"
          >
            buka tiket RSVP
          </NuxtLink>
        </p>
      </template>
    </UAlert>

    <UButton
      color="primary"
      size="xl"
      block
      icon="i-lucide-ticket"
      @click="isConfirmOpen = true"
    >
      RSVP Sekarang
    </UButton>

    <UModal
      v-model:open="isConfirmOpen"
      title="Konfirmasi RSVP Anda"
      :description="`Lengkapi data untuk ${eventTitle}.`"
    >
      <template #body>
        <UForm
          :schema="formSchema"
          :state="form"
          class="space-y-4"
          @submit="handleAuthenticatedRsvp"
        >
          <RsvpFormFields
            v-model:name="form.name"
            v-model:email="form.email"
            v-model:custom-question-answer="form.customQuestionAnswer"
            v-model:identity-type="form.identityType"
            v-model:identity-number="form.identityNumber"
            v-model:whatsapp="form.whatsapp"
            v-model:gender="form.gender"
            :custom-question-label="customQuestionLabel"
            :custom-question-required="customQuestionRequired"
            :identity-type-items="identityTypeItems"
            :gender-items="genderItems"
          />

          <UButton type="submit" color="primary" block :loading="isSubmitting">
            Konfirmasi RSVP
          </UButton>
        </UForm>
      </template>
    </UModal>
  </template>

  <template v-else>
    <header>
      <h3 class="text-xl font-bold text-on-surface">Amankan Tempat Anda</h3>

      <p class="text-on-surface-variant mt-0.5">
        Tidak memerlukan akun. Pendaftaran cepat dan gratis.
      </p>
    </header>

    <UAlert
      v-if="errorMessage"
      title="ada kesalahan!"
      :description="errorMessage"
      icon="i-lucide-triangle-alert"
      color="error"
      variant="subtle"
    />

    <UAlert
      v-if="submitResult"
      :icon="
        submitResult.emailSent ? 'i-lucide-mail-check' : 'i-lucide-mail-warning'
      "
      :color="submitResult.emailSent ? 'success' : 'warning'"
      variant="subtle"
      :title="
        submitResult.emailSent
          ? 'Reservasi berhasil'
          : 'Email konfirmasi gagal dikirim'
      "
    >
      <template #description>
        <p v-if="submitResult.emailSent">
          Cek kotak masuk Anda untuk email konfirmasi.
        </p>
        <template v-else>
          <p>Gagal mengirim email konfirmasi.</p>
          <p>Jangan khawatir, reservasi anda tetap tercatat.</p>
        </template>

        <p>
          Simpan tautan tiket Anda:
          <NuxtLink
            :to="`/rsvp/${submitResult.token}`"
            class="text-primary font-medium underline"
          >
            buka tiket RSVP
          </NuxtLink>
        </p>
      </template>
    </UAlert>

    <UForm
      v-else
      :schema="formSchema"
      :state="form"
      class="space-y-4"
      @submit="handleGuestRsvp"
    >
      <RsvpFormFields
        v-model:name="form.name"
        v-model:email="form.email"
        v-model:custom-question-answer="form.customQuestionAnswer"
        v-model:identity-type="form.identityType"
        v-model:identity-number="form.identityNumber"
        v-model:whatsapp="form.whatsapp"
        v-model:gender="form.gender"
        :custom-question-label="customQuestionLabel"
        :custom-question-required="customQuestionRequired"
        :identity-type-items="identityTypeItems"
        :gender-items="genderItems"
      />

      <UButton
        type="submit"
        color="primary"
        size="lg"
        class="w-full justify-center"
        :loading="isSubmitting"
      >
        Konfirmasi RSVP
      </UButton>
    </UForm>
  </template>
</template>
