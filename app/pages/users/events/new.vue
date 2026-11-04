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

const formStateSchema = z
  .object({
    title: z.string().min(1, 'Judul acara wajib diisi.'),
    startsAt: z.instanceof(ZonedDateTime),
    endsAt: z.instanceof(ZonedDateTime),
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
  .superRefine((data, ctx) => {
    if (!data.is_one_day && data.endsAt.compare(data.startsAt) < 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'Tanggal akhir tidak boleh sebelum tanggal awal.',
      })
    }
  })

type FormState = z.output<typeof formStateSchema>

const defaultDate = () =>
  now(getLocalTimeZone()).set({ hour: 9, minute: 0, second: 0, millisecond: 0 })

const formState = shallowReactive<FormState>({
  title: '',
  startsAt: defaultDate(),
  endsAt: defaultDate(),
  is_one_day: true,
  location: '',
  image: undefined,
  imageUrl: '',
  description: '',
})

const isUploadingImage = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const { createEvent, uploadEventImage } = useEvents()

watch(
  () => formState.image,
  async (newImage) => {
    if (!newImage) {
      return
    }

    isUploadingImage.value = true
    try {
      const res = await uploadEventImage(newImage)
      formState.imageUrl = res.data.url
    } catch (err: unknown) {
      errorMessage.value =
        err instanceof Error ? err.message : 'Gagal mengunggah gambar.'
    } finally {
      isUploadingImage.value = false
    }
  },
)

async function handleSubmit(e: FormSubmitEvent<FormState>) {
  const userId = user.value?.sub
  if (!userId) {
    errorMessage.value = 'Pengguna tidak terautentikasi.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const startsAt = e.data.startsAt.toDate().toISOString()
    const endsAt = e.data.is_one_day
      ? null
      : e.data.endsAt.toDate().toISOString()

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
    <PageHeader back-to="/users" back-label="Kembali ke Dasbor" />

    <UCard>
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
        class="grid grid-cols-2 gap-4"
        @submit="handleSubmit"
      >
        <UFormField
          label="Judul Acara"
          name="title"
          class="col-span-full"
          required
        >
          <UInput
            id="title"
            v-model="formState.title"
            placeholder="contoh: Presentasi Karir Teknik Sipil oleh PT Wijaya Karya"
            name="title"
            class="w-full"
            size="xl"
            required
          />
        </UFormField>

        <UFormField
          label="Satu hari?"
          name="is_one_day"
          help="Nyalakan bila acara hanya berlangsung dalam satu hari"
          class="col-span-full"
        >
          <UCheckbox
            id="is_one_day"
            v-model="formState.is_one_day"
            name="is_one_day"
          />
        </UFormField>

        <EventDateTimeField
          v-model="formState.startsAt"
          name="startsAt"
          label="Tanggal/waktu awal"
          required
        />

        <EventDateTimeField
          v-show="!formState.is_one_day"
          v-model="formState.endsAt"
          name="endsAt"
          label="Tanggal/waktu akhir"
          :min="formState.startsAt"
        />

        <UFormField
          label="Lokasi"
          name="location"
          class="col-span-full"
          required
        >
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
          class="order-first col-span-full"
        >
          <div class="space-y-3">
            <UFileUpload
              v-model="formState.image"
              accept="image/*"
              :loading="isUploadingImage"
              icon="i-lucide-image"
              label="Pilih atau seret gambar banner ke sini"
              description="PNG, JPG, WEBP hingga 5MB"
              size="lg"
              class="w-full"
            />
          </div>
        </UFormField>

        <UFormField label="Deskripsi" name="description" class="col-span-full">
          <UTextarea
            id="description"
            v-model="formState.description"
            :rows="4"
            placeholder="Detail mengenai persyaratan, agenda, kelayakan, dan pembicara..."
            name="description"
            class="w-full"
          />
        </UFormField>

        <USeparator class="col-span-full" />

        <div class="-col-end-1 flex justify-end gap-3">
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
