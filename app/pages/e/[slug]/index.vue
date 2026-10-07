<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useEvents } from '@/composables/useEvents'
import { useRsvp } from '@/composables/useRsvp'

const route = useRoute()
const eventSlug = computed(() => route.params.slug as string)

const user = useSupabaseUser()

const { fetchBySlug } = useEvents()
const { data: eventRes, error } = await fetchBySlug(eventSlug)

if (error.value || !eventRes.value?.data) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Acara tidak ditemukan',
  })
}

const event = computed(() => eventRes.value!.data)

const isOwner = computed(
  () =>
    user.value &&
    event.value &&
    event.value.created_by === (user.value.sub || user.value.id),
)

useSeoMeta({
  title: () => `${event.value?.title || 'Acara'} - RSVP`,
  description: () => event.value?.description || '',
})

const existingRsvp = ref<{ token: string; is_attending: boolean } | null>(null)

const { getRsvpByEventAndEmail, submit } = useRsvp()

if (user.value?.email && event.value) {
  const existing = await getRsvpByEventAndEmail(
    event.value.id,
    user.value.email,
  )
  if (existing) {
    existingRsvp.value = {
      token: existing.token,
      is_attending: existing.is_attending,
    }
  }
}

const formSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  email: z.email('Masukkan alamat email yang valid.'),
  organization: z.string().optional(),
})

type RSVPForm = z.output<typeof formSchema>

const form = reactive<RSVPForm>({
  name: user.value?.user_metadata?.full_name || '',
  email: user.value?.email || '',
  organization: '',
})

const isSubmitting = ref(false)
const rsvpSuccess = ref(false)
const rsvpToken = ref(existingRsvp.value?.token || '')
const errorMessage = ref('')
const isConfirmOpen = ref(false)

async function submitRsvp(name: string, email: string, organization?: string) {
  if (!event.value) return
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const res = await submit({
      eventId: event.value.id,
      name,
      email,
      organization,
    })

    rsvpToken.value = res.token
    rsvpSuccess.value = true
    isConfirmOpen.value = false
  } catch (err: unknown) {
    console.log(err)
    errorMessage.value = 'Gagal mengirim RSVP. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleRsvp(e: FormSubmitEvent<RSVPForm>) {
  await submitRsvp(e.data.name, e.data.email, e.data.organization)
}

async function handleAuthenticatedRsvp() {
  if (!user.value?.email) return
  const userName =
    user.value.user_metadata?.full_name || user.value.email.split('@')[0]
  await submitRsvp(userName, user.value.email)
}
</script>

<template>
  <div class="py-8 max-w-5xl mx-auto px-4 space-y-8">
    <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-arrow-left">
      Kembali ke semua acara
    </UButton>

    <div v-if="error">
      {{ error }}
    </div>

    <div
      v-if="event"
      class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
    >
      <!-- Event Info (Left Column) -->
      <section class="lg:col-span-7 space-y-6">
        <figure
          class="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 h-64 md:h-80"
        >
          <img
            :src="event.image_url"
            :alt="event.title"
            class="w-full h-full object-cover"
          />
        </figure>

        <div class="space-y-4">
          <h1 class="text-3xl font-bold text-on-surface">
            {{ event.title }}
          </h1>

          <article
            class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-surface-container border border-outline text-sm"
          >
            <time
              v-if="event.starts_at"
              :datetime="event.starts_at"
              class="flex items-center gap-2 text-on-surface-variant"
            >
              <UIcon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
              <span>{{ formatDate(event.starts_at) }}</span>
            </time>
            <div class="flex items-center gap-2 text-on-surface-variant">
              <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-primary" />
              <span>{{ event.location }}</span>
            </div>
          </article>

          <article class="space-y-2">
            <h2 class="text-xl font-bold text-on-surface">Tentang Sesi Ini</h2>
            <p
              class="text-on-surface-variant leading-relaxed whitespace-pre-line"
            >
              {{ event.description }}
            </p>
          </article>
        </div>
      </section>

      <section class="lg:col-span-5">
        <UCard
          class="sticky top-20 shadow-xl border-outline"
          :ui="{ body: 'p-6 space-y-6' }"
        >
          <div v-if="isOwner" class="space-y-4 text-center py-2">
            <h2 class="text-xl font-bold text-on-surface">Kelola Acara Anda</h2>
            <p>Sunting detil acara, atau kelola peserta</p>

            <UButton
              :to="`/e/${event.slug}/edit`"
              variant="outline"
              size="lg"
              icon="i-lucide-pencil"
              class="w-full justify-center font-bold"
              label="Edit detil acara"
            />
            <UButton
              :to="`/e/${event.slug}/manage`"
              color="primary"
              size="lg"
              class="w-full justify-center font-bold"
              icon="i-lucide-settings"
              label="Kelola Acara & Peserta"
            />
          </div>

          <div
            v-else-if="
              rsvpSuccess || (existingRsvp && existingRsvp.is_attending)
            "
            class="space-y-4 text-center py-4"
          >
            <div
              class="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto"
            >
              <UIcon name="i-lucide-check" class="w-6 h-6" />
            </div>

            <h2 class="text-xl font-bold text-on-surface">
              RSVP Terkonfirmasi!
            </h2>
            <p class="text-on-surface-variant">
              Anda telah terdaftar untuk sesi ini.
            </p>

            <div
              class="p-3 bg-surface-container rounded-lg text-on-surface-variant space-y-1"
            >
              <UButton
                :to="`/rsvp/${rsvpToken}`"
                color="neutral"
                variant="outline"
                class="w-full justify-center"
              >
                Lihat / Kelola RSVP Saya
              </UButton>
              <UButton
                to="/"
                color="primary"
                variant="ghost"
                class="w-full justify-center"
              >
                Jelajahi Acara Lain
              </UButton>
            </div>
          </div>

          <!-- Authenticated Quick RSVP -->
          <template v-else-if="user">
            <header class="space-y-1">
              <h2 class="text-xl font-bold text-on-surface">RSVP Cepat</h2>
              <p class="text-on-surface-variant">
                Masuk sebagai
                <strong class="text-on-surface">{{ user.email }}</strong>
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
              class="w-full justify-center font-bold"
              icon="i-lucide-ticket"
              @click="isConfirmOpen = true"
            >
              RSVP Sekarang
            </UButton>

            <!-- Confirm Dialog -->
            <UModal
              v-model:open="isConfirmOpen"
              title="Konfirmasi RSVP Anda"
              :description="`Pesan 1 tempat untuk ${user.email} pada acara ${event.title}?`"
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

          <!-- Guest Form State -->
          <template v-else>
            <header>
              <h3 class="text-xl font-bold text-on-surface">
                Amankan Tempat Anda
              </h3>

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
              @submit="handleRsvp"
              class="space-y-4"
            >
              <UFormField class="space-y-1.5" label="Nama lengkap">
                <UInput
                  v-model="form.name"
                  placeholder="contoh: Jane Doe"
                  required
                  class="w-full"
                />
              </UFormField>

              <UFormField class="space-y-1.5" label="Alamat email">
                <UInput
                  v-model="form.email"
                  type="email"
                  placeholder="nama@university.edu"
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
                  placeholder="contoh: Mahasiswa Ilmu Komputer tingkat akhir yang tertarik dengan magang Rekayasa Perangkat Lunak."
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
        </UCard>
      </section>
    </div>
  </div>
</template>
