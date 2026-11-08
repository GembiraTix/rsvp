<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useEvents } from '@/composables/useEvents'
import {
  getLocalTimeZone,
  parseAbsolute,
  ZonedDateTime,
} from '@internationalized/date'

import { isValidImageBuffer } from '~~/shared/utils/imageValidation'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const eventSlug = computed(() => route.params.slug as string)

const { fetchBySlug, updateEvent, uploadEventImage } = useEvents()
const { data: oldEventRes, error: oldEventError } = await fetchBySlug(eventSlug)

if (oldEventError.value || !oldEventRes.value?.data) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Acara tidak ditemukan',
  })
}

const oldEvent = computed(() => oldEventRes.value!.data)

const isUpdatingEvent = ref(false)
const isUploadingImage = ref(false)
const editErrorMessage = ref('')

const formStateSchema = z
  .object({
    title: z.string().min(1, 'Judul acara wajib diisi.'),
    location: z.string().min(1, 'Lokasi wajib diisi.'),
    startsAt: z.instanceof(ZonedDateTime).or(z.undefined()),
    endsAt: z.instanceof(ZonedDateTime).or(z.undefined()),
    description: z.string().optional(),
    customQuestionLabel: z.string().optional(),
    customQuestionRequired: z.boolean(),
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
  .superRefine((data, ctx) => {
    if (
      data.startsAt &&
      data.endsAt &&
      data.endsAt.compare(data.startsAt) < 0
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'Tanggal akhir tidak boleh sebelum tanggal awal.',
      })
    }
  })
type EditFormState = z.output<typeof formStateSchema>

const formState = shallowReactive<EditFormState>({
  title: oldEvent.value.title || '',
  location: oldEvent.value.location || '',
  startsAt: oldEvent.value.starts_at
    ? parseAbsolute(oldEvent.value.starts_at, getLocalTimeZone())
    : undefined,
  endsAt: oldEvent.value.ends_at
    ? parseAbsolute(oldEvent.value.ends_at, getLocalTimeZone())
    : undefined,
  description: oldEvent.value.description || undefined,
  imageUrl: oldEvent.value.image_url || undefined,
  image: undefined,
  customQuestionLabel: oldEvent.value.custom_question_label || '',
  customQuestionRequired: oldEvent.value.custom_question_required || false,
})

watch(
  () => formState.image,
  async (newImage) => {
    if (!newImage) {
      return
    }

    isUploadingImage.value = true
    try {
      const res = await uploadEventImage(newImage)
      if (!res.success) {
        throw Error('gagal mengunggah gambar. coba lagi')
      }
      formState.imageUrl = res.data.url
    } catch (err: unknown) {
      editErrorMessage.value = // TODO: make error res nicer
        err instanceof Error ? err.message : 'Gagal mengunggah gambar.'
    } finally {
      isUploadingImage.value = false
    }
  },
)

async function handleUpdateEvent(e: FormSubmitEvent<EditFormState>) {
  isUpdatingEvent.value = true
  editErrorMessage.value = ''

  try {
    await updateEvent(oldEvent.value.id, {
      title: e.data.title,
      location: e.data.location,
      startsAt: e.data.startsAt?.toDate().toISOString(),
      endsAt: e.data.endsAt?.toDate().toISOString(),
      description: e.data.description,
      imageUrl: e.data.imageUrl,
      customQuestionLabel: e.data.customQuestionLabel || null,
      customQuestionRequired: e.data.customQuestionRequired,
    })
    toast.add({
      title: 'Acara berhasil diperbarui.',
      color: 'success',
      icon: 'i-lucide-circle-check',
    })
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
  <div class="py-8 max-w-3xl mx-auto px-4 space-y-6">
    <UButton
      to="/users"
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
    >
      Kembali ke Dasbor
    </UButton>

    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold text-on-surface">
          Menyunting {{ oldEvent?.title }}
        </h1>
      </template>

      <UAlert
        v-if="editErrorMessage"
        :title="editErrorMessage"
        icon="i-lucide-alert-circle"
        color="error"
        variant="subtle"
      />

      <UForm
        :schema="formStateSchema"
        :state="formState"
        class="grid grid-cols-2 gap-4"
        @submit="handleUpdateEvent"
      >
        <UFormField
          label="Judul Acara"
          name="title"
          class="col-span-full"
          required
        >
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

        <EventDateTimeField
          v-model="formState.startsAt"
          name="startsAt"
          label="Tanggal/waktu awal"
          required
        />

        <EventDateTimeField
          v-model="formState.endsAt"
          name="endsAt"
          label="Tanggal/waktu akhir"
          :min="formState.startsAt"
          :fallback="formState.startsAt"
        />

        <UFormField label="Lokasi" name="location" required>
          <UInput
            id="edit-location"
            v-model="formState.location"
            placeholder="contoh: Auditorium Utama / Ruang 204"
            name="location"
            class="w-full"
            size="lg"
            required
          />
        </UFormField>

        <UFormField
          label="Gambar Banner Acara"
          name="imageUrl"
          description="Gambar langsung diunggah saat dipilih. Format: JPG, PNG, WEBP (maks. 5MB)."
          class="col-span-full order-first"
        >
          <div class="space-y-3">
            <UFileUpload
              v-model="formState.image"
              accept="image/*"
              :loading="isUploadingImage"
              icon="i-lucide-image"
              label="Pilih atau seret gambar banner baru ke sini"
              description="PNG, JPG, WEBP hingga 5MB"
              size="lg"
              class="w-full"
            />
          </div>
        </UFormField>

        <UFormField label="Deskripsi" name="description" class="col-span-full">
          <UTextarea
            id="edit-description"
            v-model="formState.description"
            :rows="4"
            placeholder="Detail mengenai persyaratan, agenda, kelayakan, dan pembicara..."
            name="description"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Pertanyaan tambahan"
          name="customQuestionLabel"
          help="Kosongkan bila tidak ada. Jawaban tersimpan pada data peserta."
          class="col-span-full"
        >
          <UInput
            id="edit-custom-question-label"
            v-model="formState.customQuestionLabel"
            placeholder="contoh: Angkatan"
            name="customQuestionLabel"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Pertanyaan tambahan wajib?"
          name="customQuestionRequired"
          class="col-span-full"
        >
          <UCheckbox
            id="edit-custom-question-required"
            v-model="formState.customQuestionRequired"
            name="customQuestionRequired"
            :disabled="!formState.customQuestionLabel"
          />
        </UFormField>

        <USeparator class="col-span-full" />

        <UButton
          color="primary"
          type="submit"
          :loading="isUpdatingEvent"
          class="-col-end-1 place-self-end"
        >
          Simpan Perubahan
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>
