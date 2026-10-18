<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useSiteName } from '@/composables/useSiteName'
import { isValidImageBuffer } from '~~/shared/utils/imageValidation'
import { getLocalTimeZone, now, ZonedDateTime } from '@internationalized/date'

definePageMeta({
  middleware: 'auth',
})

const siteName = useSiteName()
useSeoMeta({
  title: `Buat Acara Baru - ${siteName}`,
})

const user = useSupabaseUser()

const formStateSchema = z.object({
  title: z.string().min(1, 'Judul acara wajib diisi.'),
  date: z.object({
    starts_at: z.instanceof(ZonedDateTime),
    ends_at: z.instanceof(ZonedDateTime),
  }),
  is_one_day: z.boolean(),
  location: z.string().min(1, 'Lokasi wajib diisi.'),
  imageUrl: z.url('URL gambar tidak valid.').optional().or(z.literal('')),
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
  description: z.string().optional(),
})

type FormState = z.output<typeof formStateSchema>

const formState = shallowRef<FormState>({
  title: '',
  date: {
    starts_at: now(getLocalTimeZone()),
    ends_at: now(getLocalTimeZone()),
  },
  is_one_day: true,
  location: '',
  image: undefined,
  imageUrl: '',
  description: '',
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
      formState.value.imageUrl = res.data.url
    } catch (err: unknown) {
      errorMessage.value =
        err instanceof Error ? err.message : 'Gagal mengunggah gambar.'
    } finally {
      isUploadingImage.value = false
    }
  },
)

const isLoading = ref(false)
const isUploadingImage = ref(false)
const errorMessage = ref('')

const { createEvent, uploadEventImage } = useEvents()

async function handleSubmit(e: FormSubmitEvent<FormState>) {
  const userId = user.value?.sub
  if (!userId) {
    errorMessage.value = 'Pengguna tidak terautentikasi.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const startsAt = e.data.date.starts_at
      ? e.data.date.starts_at.toDate().toUTCString()
      : ''
    const endsAt =
      e.data.is_one_day && e.data.date.ends_at
        ? e.data.date.ends_at.toDate().toUTCString()
        : null

    const res = await createEvent({
      title: e.data.title,
      location: e.data.location,
      startsAt,
      endsAt,
      description: e.data.description || null,
      imageUrl: e.data.imageUrl || null,
    })

    if (res.data?.slug) {
      await navigateTo(`/e/${res.data.slug}/manage`)
    } else {
      await navigateTo('/users')
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Gagal membuat acara. Silakan coba lagi.'
    }
  } finally {
    isLoading.value = false
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

    <UCard class="border-outline shadow-md">
      <template #header>
        <h1 class="text-2xl font-bold text-on-surface">Buat Acara</h1>
      </template>

      <UAlert
        v-if="errorMessage"
        title="Ada kesalahan!"
        :description="errorMessage"
        color="error"
        icon="i-lucide-triangle-alert"
        variant="subtle"
      />

      <UForm
        :schema="formStateSchema"
        :state="formState"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField label="Judul Acara" name="title" required>
          <UInput
            id="title"
            v-model="formState.title"
            placeholder="contoh: Presentasi Karir Teknik Sipil oleh PT Wijaya Karya"
            name="title"
            class="w-full"
            required
          />
        </UFormField>

        <div class="grid gap-4">
          <UFormField
            label="Satu hari?"
            name="is_one_day"
            help="Nyalakan bila acara hanya berlangsung dalam satu hari"
          >
            <UCheckbox
              id="is_one_day"
              v-model="formState.is_one_day"
              name="is_one_day"
            />
          </UFormField>

          <UFormField label="Tanggal Awal" name="date.starts_at" required>
            <UInputDate
              id="starts_at"
              v-model="formState.date.starts_at"
              type="date"
              name="starts_at"
              class="w-full"
            />
          </UFormField>

          <div v-show="!formState.is_one_day">
            <UFormField label="Tanggal Akhir" name="date.ends_at">
              <UInputDate
                id="ends_at"
                v-model="formState.date.ends_at"
                :defaultValue="now(getLocalTimeZone())"
                :is-date-unavailable="
                  () =>
                    formState.date.ends_at.toDate() <
                    formState.date.starts_at.toDate()
                "
                type="date"
                name="ends_at"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <UFormField label="Lokasi" name="location" required>
          <UInput
            id="location"
            v-model="formState.location"
            placeholder="contoh: Auditorium Utama / Ruang 204"
            name="location"
            class="w-full"
            required
          />
        </UFormField>

        <UFormField
          label="Gambar Banner Acara"
          name="image"
          description="Gambar langsung diunggah saat dipilih. Format: JPG, PNG, WEBP (maks. 5MB)."
        >
          <div class="space-y-3">
            <UFileUpload
              v-model="formState.image"
              accept="image/*"
              :loading="isUploadingImage"
              icon="i-lucide-upload-cloud"
              label="Pilih atau seret gambar banner ke sini"
              description="PNG, JPG, WEBP hingga 5MB"
              class="w-full"
            />
          </div>
        </UFormField>

        <UFormField label="Deskripsi" name="description">
          <UTextarea
            id="description"
            v-model="formState.description"
            :rows="4"
            placeholder="Detail mengenai persyaratan, agenda, kelayakan, dan pembicara..."
            name="description"
            class="w-full"
          />
        </UFormField>

        <div class="pt-4 flex justify-end gap-3 border-t border-outline">
          <UButton to="/users" variant="ghost" color="neutral"> Batal </UButton>
          <UButton
            class="active:translate-y-1"
            type="submit"
            color="primary"
            :loading="isLoading"
            label="Publikasikan Acara"
          />
        </div>
      </UForm>
    </UCard>
  </div>
</template>
