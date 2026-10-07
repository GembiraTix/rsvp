<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useEvents } from '@/composables/useEvents'
import {
  getLocalTimeZone,
  ZonedDateTime,
  parseAbsolute,
} from '@internationalized/date'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const eventSlug = computed(() => route.params.slug as string)

const { fetchBySlug, updateEvent } = useEvents()
const {
  data: { value: oldEvent },
} = await fetchBySlug(eventSlug)

const isUpdatingEvent = ref(false)
const editErrorMessage = ref('')
const editSuccessMessage = ref('')

const editFormSchema = z.object({
  title: z.string().min(1, 'Judul acara wajib diisi.'),
  location: z.string().min(1, 'Lokasi wajib diisi.'),
  startsAt: z.instanceof(ZonedDateTime).or(z.undefined()),
  endsAt: z.instanceof(ZonedDateTime).or(z.undefined()),
  description: z.string().optional(),
  imageUrl: z.url('URL gambar tidak valid.').optional().or(z.literal('')),
})
type EditFormState = z.output<typeof editFormSchema>

watch(
  oldEvent!.data,
  (newEvent) => {
    if (!newEvent) return
    formState.title = newEvent.title || ''
    formState.location = newEvent.location || ''
    formState.startsAt = newEvent.starts_at || undefined
    formState.endsAt = newEvent.ends_at || undefined
    formState.description = newEvent.description || undefined
    formState.imageUrl = newEvent.image_url || undefined
  },
  { immediate: true },
)

const formState = reactive<EditFormState>({
  title: oldEvent?.data.title || '',
  location: oldEvent?.data.location || '',
  startsAt: oldEvent?.data.starts_at
    ? parseAbsolute(oldEvent?.data.starts_at, getLocalTimeZone())
    : undefined,
  endsAt: oldEvent?.data.ends_at
    ? parseAbsolute(oldEvent?.data.ends_at, getLocalTimeZone())
    : undefined,
  description: oldEvent?.data.description || undefined,
  imageUrl: oldEvent?.data.image_url || undefined,
})

async function handleUpdateEvent(e: FormSubmitEvent<EditFormState>) {
  if (!oldEvent) return

  isUpdatingEvent.value = true
  editErrorMessage.value = ''
  editSuccessMessage.value = ''

  try {
    await updateEvent(oldEvent.data.id, {
      title: e.data.title,
      location: e.data.location,
      startsAt: e.data.startsAt?.toDate().toISOString(),
      endsAt: e.data.endsAt?.toDate().toISOString(),
      description: e.data.description,
      imageUrl: e.data.imageUrl,
    })
    editSuccessMessage.value = 'Acara berhasil diperbarui!'
    setTimeout(() => {
      editSuccessMessage.value = ''
    }, 10000)
  } catch (err: unknown) {
    if (err instanceof Error) {
      editErrorMessage.value = err.message
    } else {
      editErrorMessage.value = 'Gagal memperbarui acara.'
    }
  } finally {
    isUpdatingEvent.value = false
  }
}
</script>

<template>
  <div class="py-8 max-w-6xl mx-auto px-4 space-y-">
    <!-- <UButton -->
    <!--   to="/users" -->
    <!--   variant="ghost" -->
    <!--   color="neutral" -->
    <!--   icon="i-lucide-arrow-left" -->
    <!-- > -->
    <!--   Kembali ke Dasbor -->
    <!-- </UButton> -->

    <h1>Menyunting {{ oldEvent?.data.title }}</h1>

    <UAlert
      v-if="editErrorMessage"
      :title="editErrorMessage"
      icon="i-lucide-alert-circle"
      color="error"
      variant="subtle"
    />

    <UAlert
      v-if="editSuccessMessage"
      :title="editSuccessMessage"
      icon="i-lucide-check-circle"
      color="success"
      variant="subtle"
    />

    <UForm
      :schema="editFormSchema"
      :state="formState"
      class="space-y-4"
      @submit="handleUpdateEvent"
    >
      <UFormField label="Judul Acara" name="title" required>
        <UInput
          id="edit-title"
          v-model="formState.title"
          placeholder="contoh: Presentasi Karir Teknik Sipil oleh PT Wijaya Karya"
          name="title"
          class="w-full"
          size="xl"
          required
        />
      </UFormField>

      <UFormField label="Tanggal Awal" name="starts_at" required>
        <UInputDate
          id="starts_at"
          v-model="formState.startsAt"
          type="date"
          name="starts_at"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Tanggal Akhir" name="ends_at">
        <UInputDate
          id="ends_at"
          v-model="formState.endsAt"
          :is-date-unavailable="
            () => {
              if (formState.endsAt && formState.startsAt) {
                return formState.endsAt?.toDate() < formState.startsAt?.toDate()
              } else {
                return false
              }
            }
          "
          type="date"
          name="ends_at"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Lokasi" name="location" required>
        <UInput
          id="edit-location"
          v-model="formState.location"
          placeholder="contoh: Auditorium Utama / Ruang 204"
          name="location"
          class="w-full"
          required
        />
      </UFormField>

      <UFormField label="URL Gambar Banner" name="imageUrl">
        <UInput
          id="edit-imageUrl"
          v-model="formState.imageUrl"
          placeholder="https://images.unsplash.com/photo-..."
          name="imageUrl"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Deskripsi" name="description">
        <UTextarea
          id="edit-description"
          v-model="formState.description"
          :rows="4"
          placeholder="Detail mengenai persyaratan, agenda, kelayakan, dan pembicara..."
          name="description"
          class="w-full"
        />
      </UFormField>

      <div class="pt-4 flex justify-end gap-3 border-t border-outline">
        <UButton color="primary" type="submit" :loading="isUpdatingEvent">
          Simpan Perubahan
        </UButton>
      </div>
    </UForm>
  </div>
</template>
