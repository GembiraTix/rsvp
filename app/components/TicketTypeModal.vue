<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useTicketTypes } from '@/composables/useTicketTypes'
import type { TicketType } from '~~/server/domain/types'

const props = defineProps<{
  eventId: number
  ticketType: TicketType | null
}>()

const emit = defineEmits<{ saved: [notice: string] }>()

const isModalOpen = defineModel<boolean>('open', { required: true })

const { createTicketType, updateTicketType } = useTicketTypes()

const isSaving = ref(false)
const errorMessage = ref('')

const ticketTypeFormSchema = z.object({
  name: z.string().nonempty('Nama tiket wajib diisi.'),
  description: z.string().optional(),
  kind: z.enum(['single', 'couple', 'berempat']),
  price: z.coerce.number().int().min(0, 'Harga tidak valid.'),
  capacity: z.preprocess(
    (value) =>
      value === '' || value === null || value === undefined ? undefined : value,
    z.coerce.number().int().positive().optional(),
  ),
  minQty: z.number().int().min(1, 'Jumlah minimal harus minimal 1.'),
  maxQty: z.number().int().min(1, 'Jumlah maksimal harus minimal 1.'),
  multipleOf: z.number().int().min(1, 'Kelipatan harus minimal 1.'),
  isActive: z.boolean(),
})

type TicketTypeForm = z.output<typeof ticketTypeFormSchema>

const ticketTypeFormState = reactive<TicketTypeForm>({
  name: '',
  description: '',
  kind: 'single',
  price: 0,
  capacity: undefined,
  minQty: 1,
  maxQty: 10,
  multipleOf: 1,
  isActive: true,
})

watch(
  () => [isModalOpen.value, props.ticketType] as const,
  ([open, ticket]) => {
    if (!open) return
    errorMessage.value = ''
    if (ticket) {
      ticketTypeFormState.name = ticket.name
      ticketTypeFormState.description = ticket.description ?? ''
      ticketTypeFormState.kind = ticket.kind
      ticketTypeFormState.price = ticket.price
      ticketTypeFormState.capacity = ticket.capacity ?? undefined
      ticketTypeFormState.minQty = ticket.min_qty
      ticketTypeFormState.maxQty = ticket.max_qty
      ticketTypeFormState.multipleOf = ticket.multiple_of
      ticketTypeFormState.isActive = ticket.is_active
    } else {
      ticketTypeFormState.name = ''
      ticketTypeFormState.description = ''
      ticketTypeFormState.kind = 'single'
      ticketTypeFormState.price = 0
      ticketTypeFormState.capacity = undefined
      ticketTypeFormState.minQty = 1
      ticketTypeFormState.maxQty = 10
      ticketTypeFormState.multipleOf = 1
      ticketTypeFormState.isActive = true
    }
  },
  { immediate: true },
)

async function handleSubmit({ data: body }: FormSubmitEvent<TicketTypeForm>) {
  isSaving.value = true
  errorMessage.value = ''

  try {
    if (props.ticketType) {
      await updateTicketType(props.eventId, props.ticketType.id, body)
      emit('saved', 'Tipe tiket berhasil diperbarui.')
    } else {
      await createTicketType(props.eventId, body)
      emit('saved', 'Tipe tiket berhasil dibuat.')
    }

    isModalOpen.value = false
  } catch (err: unknown) {
    errorMessage.value = getErrorMessage(
      err,
      'Gagal menyimpan tipe tiket. Silakan coba lagi.',
    )
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isModalOpen"
    :title="ticketType ? 'Ubah tipe tiket' : 'Buat tipe tiket baru'"
  >
    <template #body>
      <UAlert
        v-if="errorMessage"
        title="Ada kesalahan!"
        :description="errorMessage"
        color="error"
        icon="i-lucide-triangle-alert"
        variant="subtle"
        class="mb-4"
      />

      <UForm
        class="space-y-4"
        :schema="ticketTypeFormSchema"
        :state="ticketTypeFormState"
        @submit="handleSubmit"
      >
        <UFormField label="Nama tiket" name="name">
          <UInput
            v-model="ticketTypeFormState.name"
            type="text"
            name="name"
            class="w-full"
            required
          />
        </UFormField>

        <UFormField label="Deskripsi" name="description" hint="opsional">
          <UInput
            v-model="ticketTypeFormState.description"
            type="text"
            name="description"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Tipe tiket" name="kind">
          <USelect
            v-model="ticketTypeFormState.kind"
            name="kind"
            :items="[
              { label: 'Single (1 orang)', value: 'single' },
              { label: 'Couple (2 orang)', value: 'couple' },
              { label: 'Berempat (4 orang)', value: 'berempat' },
            ]"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Harga" name="price" required>
          <UInput
            v-model="ticketTypeFormState.price"
            type="number"
            name="price"
            class="w-full"
            :min="0"
          />
        </UFormField>

        <UFormField label="Kapasitas" name="capacity" hint="default: tak terbatas">
          <UInput
            v-model="ticketTypeFormState.capacity"
            type="number"
            name="capacity"
            class="w-full"
            placeholder="∞"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-3">
          <UFormField label="Jumlah minimal" name="min_qty" required>
            <UInput
              v-model="ticketTypeFormState.minQty"
              type="number"
              name="min_qty"
              class="w-full"
              :min="1"
            />
          </UFormField>

          <UFormField label="Jumlah maksimal" name="max_qty" required>
            <UInput
              v-model="ticketTypeFormState.maxQty"
              type="number"
              name="max_qty"
              class="w-full"
              :min="1"
            />
          </UFormField>

          <UFormField label="Kelipatan" name="multiple_of" required>
            <UInput
              v-model="ticketTypeFormState.multipleOf"
              type="number"
              name="multiple_of"
              class="w-full"
              :min="1"
            />
          </UFormField>
        </div>

        <UFormField
          label="Tampilkan di halaman acara"
          name="is_active"
          orientation="horizontal"
        >
          <USwitch
            uncheckedIcon="i-lucide-x"
            checkedIcon="i-lucide-check"
            v-model="ticketTypeFormState.isActive"
            name="is_active"
          />
        </UFormField>

        <UButton
          type="submit"
          :label="ticketType ? 'Simpan Perubahan' : 'Simpan'"
          :loading="isSaving"
        />
      </UForm>
    </template>
  </UModal>
</template>
