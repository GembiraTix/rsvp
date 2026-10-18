<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useEvents } from '@/composables/useEvents'
import {
  getLocalTimeZone,
  ZonedDateTime,
  parseAbsolute,
  parseZonedDateTime,
} from '@internationalized/date'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const eventSlug = computed(() => route.params.slug as string)

const { fetchBySlug, updateEvent, uploadEventImage } = useEvents()
const {
  data: { value: oldEvent },
} = await fetchBySlug(eventSlug)

const isUpdatingEvent = ref(false)
const isUploadingImage = ref(false)
const editErrorMessage = ref('')
const editSuccessMessage = ref('')

import { isValidImageBuffer } from '~~/shared/utils/imageValidation'

const formStateSchema = z.object({
  title: z.string().min(1, 'Judul acara wajib diisi.'),
  location: z.string().min(1, 'Lokasi wajib diisi.'),
  startsAt: z.instanceof(ZonedDateTime).or(z.undefined()),
  endsAt: z.instanceof(ZonedDateTime).or(z.undefined()),
  description: z.string().optional(),
  image: z
    .instanceof(File, { message: 'URL gambar tidak valid.' })
    .optional()
    .refine(
      (file) => {
        if (!file) return true

        const maxBytes = 5 * 1024 * 1024 // 5MB
        return file && file.size < maxBytes
      },
      { message: 'Ukuran berkas melebihi batas maksimum 5MB.' },
    )
    .refine(
      (file) => {
        if (!file) return true

        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ]
        return file && allowedTypes.includes(file.type)
      },
      {
        message:
          'Tipe berkas tidak didukung. Harap unggah gambar JPG, PNG, WEBP, atau GIF.',
      },
    )
    .refine(
      async (file) => {
        if (!file) return true

        const buffer = await file.slice(0, 32).arrayBuffer()
        return isValidImageBuffer(buffer)
      },
      { message: 'Konten berkas bukan merupakan format gambar yang valid.' },
    ),
  imageUrl: z.url().optional(),
})
type EditFormState = z.output<typeof formStateSchema>

watch(
  () => oldEvent!.data,
  (newEvent) => {
    if (!newEvent) return
    formState.value.title = newEvent.title || ''
    formState.value.location = newEvent.location || ''
    formState.value.startsAt = newEvent.starts_at
      ? parseZonedDateTime(newEvent.starts_at)
      : undefined
    formState.value.endsAt = newEvent.ends_at
      ? parseZonedDateTime(newEvent.ends_at)
      : undefined
    formState.value.description = newEvent.description || undefined
    formState.value.imageUrl = newEvent.image_url || undefined
  },
)

const formState = shallowRef<EditFormState>({
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
  image: undefined,
})

watch(
  () => formState.value.image,
  async (newImage) => {
    if (!newImage) {
      console.log('no image')
      return
    }

    try {
      const res = await uploadEventImage(newImage)
      if (!res.success) {
        throw Error('gagal mengunggah gambar. coba lagi')
      }
      formState.value.imageUrl = res.data.url
    } catch (err: unknown) {
      editErrorMessage.value = // TODO: make error res nicer
        err instanceof Error ? err.message : 'Gagal mengunggah gambar.'
    } finally {
      isUploadingImage.value = false
    }
  },
)

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
      :schema="formStateSchema"
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

      <UFormField
        label="Gambar Banner Acara"
        name="imageUrl"
        description="Gambar langsung diunggah saat dipilih. Format: JPG, PNG, WEBP (maks. 5MB)."
      >
        <div class="space-y-3">
          <UFileUpload
            v-model="formState.image"
            accept="image/*"
            :loading="isUploadingImage"
            icon="i-lucide-upload-cloud"
            label="Pilih atau seret gambar banner baru ke sini"
            description="PNG, JPG, WEBP hingga 5MB"
            class="w-full"
          />
        </div>
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
