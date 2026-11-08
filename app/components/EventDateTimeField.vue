<script setup lang="ts">
import type { ZonedDateTime } from '@internationalized/date'
import {
  getLocalTimeZone,
  now,
  toCalendarDate,
  toTime,
} from '@internationalized/date'

const props = defineProps<{
  label: string
  name: string
  required?: boolean
  min?: ZonedDateTime
  fallback?: ZonedDateTime
}>()

const model = defineModel<ZonedDateTime | undefined>()

const isOpen = ref(false)

// UCalendar/UInputTime emit values from their own bundled
// @internationalized/date copy — never assign them to state directly.
// Read fields off the emitted value and .set() on an app-class base.
const dateModel = computed({
  get: () => model.value,
  set: (value) => {
    const date = value ? toCalendarDate(value) : undefined
    if (!date) return

    const base = model.value ?? props.fallback ?? now(getLocalTimeZone())
    model.value = base.set({
      year: date.year,
      month: date.month,
      day: date.day,
    })
    isOpen.value = false
  },
})

const timeModel = computed({
  get: () => (model.value ? toTime(model.value) : undefined),
  set: (value) => {
    if (!value) return

    const base = model.value ?? props.fallback ?? now(getLocalTimeZone())
    model.value = base.set({
      hour: value.hour,
      minute: value.minute,
      second: 0,
      millisecond: 0,
    })
  },
})
</script>

<template>
  <UFormField :label="label" :name="name" :required="required">
    <div class="flex gap-2">
      <UPopover v-model:open="isOpen" class="flex-1">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-calendar"
          trailing-icon="i-lucide-chevron-down"
          class="w-full justify-between font-normal"
        >
          {{
            model
              ? formatDate(model.toDate(), { dateStyle: 'long' })
              : 'Pilih tanggal'
          }}
        </UButton>

        <template #content>
          <UCalendar
            v-model="dateModel"
            :min-value="min"
            locale="id-ID"
            initial-focus
            prevent-deselect
          />
        </template>
      </UPopover>

      <UInputTime
        v-model="timeModel"
        :hour-cycle="24"
        locale="id-ID"
        class="w-32"
      />
    </div>
  </UFormField>
</template>
