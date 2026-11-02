<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useSiteName } from '@/composables/useSiteName'
import { isValidImageBuffer } from '~~/shared/utils/imageValidation'
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'

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
    date: z.object({
      starts_at: z.instanceof(CalendarDate),
      ends_at: z.instanceof(CalendarDate),
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
  .superRefine((data, ctx) => {
    if (
      !data.is_one_day &&
      data.date.ends_at.compare(data.date.starts_at) < 0
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['date', 'ends_at'],
        message: 'Tanggal akhir tidak boleh sebelum tanggal awal.',
      })
    }
  })

type FormState = z.output<typeof formStateSchema>

const formState = shallowReactive<FormState>({
  title: '',
  date: {
    starts_at: today(getLocalTimeZone()),
    ends_at: today(getLocalTimeZone()),
  },
  is_one_day: true,
  location: '',
  image: undefined,
  imageUrl: '',
  description: '',
})

const isStartCalendarOpen = ref(false)
const isEndCalendarOpen = ref(false)

const startsAtModel = computed({
  get: () => formState.date.starts_at,
  set: (value: unknown) => {
    if (!(value instanceof CalendarDate)) return
    formState.date = { ...formState.date, starts_at: value }
    isStartCalendarOpen.value = false
  },
})

const endsAtModel = computed({
  get: () => formState.date.ends_at,
  set: (value: unknown) => {
    if (!(value instanceof CalendarDate)) return
    formState.date = { ...formState.date, ends_at: value }
    isEndCalendarOpen.value = false
  },
})

watch(
  () => formState.image,
  async (newImage) => {
    if (!newImage) {
      console.log('no image')
      return
    }

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
      .toDate(getLocalTimeZone())
      .toISOString()
    const endsAt = e.data.is_one_day
      ? null
      : e.data.date.ends_at.toDate(getLocalTimeZone()).toISOString()

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

        <UFormField label="Tanggal Awal" name="date.starts_at" required>
          <UPopover v-model:open="isStartCalendarOpen">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-calendar"
              trailing-icon="i-lucide-chevron-down"
              class="w-full justify-between font-normal"
            >
              {{
                formatDate(
                  formState.date.starts_at.toDate(getLocalTimeZone()),
                  { dateStyle: 'long', timeZone: undefined },
                )
              }}
            </UButton>

            <template #content>
              <UCalendar
                v-model="startsAtModel"
                locale="id-ID"
                initial-focus
                prevent-deselect
              />
            </template>
          </UPopover>
        </UFormField>

        <UFormField
          v-show="!formState.is_one_day"
          label="Tanggal Akhir"
          name="date.ends_at"
        >
          <UPopover v-model:open="isEndCalendarOpen">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-calendar"
              trailing-icon="i-lucide-chevron-down"
              class="w-full justify-between font-normal"
            >
              {{
                formatDate(formState.date.ends_at.toDate(getLocalTimeZone()), {
                  dateStyle: 'long',
                  timeZone: undefined,
                })
              }}
            </UButton>

            <template #content>
              <UCalendar
                v-model="endsAtModel"
                :min-value="formState.date.starts_at"
                locale="id-ID"
                initial-focus
                prevent-deselect
              />
            </template>
          </UPopover>
        </UFormField>

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
