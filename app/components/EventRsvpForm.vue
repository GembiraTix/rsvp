<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useRsvp } from '@/composables/useRsvp'
import type { UserProfile } from '~~/server/domain/types'

const props = defineProps<{
  eventId: number
  eventTitle: string | null
  mode: 'guest' | 'authenticated'
  profile: UserProfile | null
}>()

const emit = defineEmits<{ registered: [token: string] }>()

const { submit } = useRsvp()

const isSubmitting = ref(false)
const errorMessage = ref('')
const isConfirmOpen = ref(false)

const formSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  email: z.email('Masukkan alamat email yang valid.'),
  organization: z.string().optional(),
})

type RSVPForm = z.output<typeof formSchema>

const form = reactive<RSVPForm>({
  name: '',
  email: '',
  organization: '',
})

async function submitRsvp(name: string, email: string, organization?: string) {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const res = await submit({
      eventId: props.eventId,
      name,
      email,
      organization,
    })
    emit('registered', res.token)
  } catch {
    errorMessage.value = 'Gagal mengirim RSVP. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleGuestRsvp(e: FormSubmitEvent<RSVPForm>) {
  await submitRsvp(e.data.name, e.data.email, e.data.organization)
}

async function handleAuthenticatedRsvp() {
  const email = props.profile?.email
  if (!email) return
  const userName = props.profile?.name || email.split('@')[0] || email
  await submitRsvp(userName, email)
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
      title="ada kesalahan!"
      v-if="errorMessage"
      :description="errorMessage"
      icon="i-lucide-triangle-alert"
      color="error"
      variant="subtle"
    />

    <UButton
      color="primary"
      size="xl"
      block
      icon="i-lucide-ticket"
      @click="isConfirmOpen = true"
    >
      RSVP Sekarang
    </UButton>

    <!-- Confirm Dialog -->
    <UModal
      v-model:open="isConfirmOpen"
      title="Konfirmasi RSVP Anda"
      :description="`Pesan 1 tempat untuk ${profile?.email} pada acara ${eventTitle}?`"
    >
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isConfirmOpen = false"
          >
            Batal
          </UButton>
          <UButton
            color="primary"
            :loading="isSubmitting"
            @click="handleAuthenticatedRsvp"
          >
            Konfirmasi RSVP
          </UButton>
        </div>
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
      title="ada kesalahan!"
      v-if="errorMessage"
      :description="errorMessage"
      icon="i-lucide-triangle-alert"
      color="error"
      variant="subtle"
    />

    <UForm
      :schema="formSchema"
      :state="form"
      @submit="handleGuestRsvp"
      class="space-y-4"
    >
      <UFormField class="space-y-1.5" label="Nama lengkap">
        <UInput
          v-model="form.name"
          placeholder="Andi Johan"
          required
          class="w-full"
        />
      </UFormField>

      <UFormField class="space-y-1.5" label="Alamat email">
        <UInput
          v-model="form.email"
          type="email"
          placeholder="andi@example.com"
          required
          class="w-full"
        />
      </UFormField>

      <UFormField
        class="space-y-1.5"
        label="Organisasi / Latar Belakang"
        hint="opsional"
      >
        <UTextarea
          v-model="form.organization"
          placeholder="Mahasiswa Ilmu Komputer"
          :rows="3"
          class="w-full"
        />
      </UFormField>

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
