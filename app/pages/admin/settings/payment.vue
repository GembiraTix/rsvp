<script setup lang="ts">
import * as z from 'zod'
import { useAdminSettings } from '@/composables/useAdminSettings'
import { formatRupiah } from '@/utils'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Pengaturan Pembayaran - Admin',
})

const schema = z.object({
  admin_fee: z.number().int().min(0),
})

type FormState = z.output<typeof schema>

const { fetchPaymentSettings, updatePaymentSettings } = useAdminSettings()
const { data: settingsRes } = await fetchPaymentSettings()

const form = reactive<FormState>({
  admin_fee: settingsRes.value?.data.admin_fee ?? 0,
})

const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function onSubmit() {
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await updatePaymentSettings(form.admin_fee)
    successMessage.value = 'Pengaturan berhasil disimpan.'
  } catch (err) {
    errorMessage.value =
      err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-on-surface">Pengaturan Pembayaran</h1>

    <UCard class="max-w-xl">
      <UForm
        :schema="schema"
        :state="form"
        class="space-y-4"
        @submit="onSubmit"
      >
        <p class="text-sm text-on-surface-variant">
          Biaya layanan ini berlaku untuk semua acara secara default. Acara
          dengan pengaturan biaya khusus tetap menggunakan nilainya sendiri.
        </p>

        <UFormField
          label="Biaya layanan (Rp)"
          name="admin_fee"
          description="Dikenakan sekali per pesanan."
        >
          <UInputNumber
            v-model="form.admin_fee"
            :min="0"
            :step="500"
            class="w-48"
          />
          <p class="mt-1 text-sm text-on-surface-variant">
            {{ formatRupiah(form.admin_fee || 0) }}
          </p>
        </UFormField>

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :description="errorMessage"
        />

        <UAlert
          v-if="successMessage"
          color="success"
          variant="subtle"
          icon="i-lucide-circle-check"
          :description="successMessage"
        />

        <UButton type="submit" :loading="isSubmitting">Simpan</UButton>
      </UForm>
    </UCard>
  </div>
</template>
