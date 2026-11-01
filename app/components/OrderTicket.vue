<script setup lang="ts">
import type { TicketWithTypeName } from '~~/server/domain/types'

const props = defineProps<{ ticket: TicketWithTypeName }>()

const ticketQrEnabled = useRuntimeConfig().public.ticketQrEnabled

const qrDataUrl = ref('')
const qrFailed = ref(false)

onMounted(async () => {
  if (!ticketQrEnabled) return
  try {
    const QRCode = await import('qrcode')
    qrDataUrl.value = await QRCode.toDataURL(props.ticket.token, {
      margin: 1,
      width: 200,
    })
  } catch {
    qrFailed.value = true
  }
})

const fieldsEntries = computed(() =>
  Object.entries(props.ticket.fields ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== '',
  ),
)
</script>

<template>
  <UCollapsible class="border border-outline rounded-lg">
    <UButton
      variant="ghost"
      color="neutral"
      class="w-full justify-between p-4 rounded-lg"
    >
      <span class="flex items-center gap-3">
        <UIcon name="i-lucide-ticket" class="size-5 text-on-surface-variant" />
        <span class="flex flex-col items-start text-left">
          <span class="font-medium text-on-surface">
            {{ ticket.attendee_name }}
          </span>
          <span class="text-sm text-on-surface-variant">
            {{
              ticket.ticket_type_name || `Tipe tiket #${ticket.ticket_type_id}`
            }}
          </span>
        </span>
      </span>
      <span class="flex items-center gap-3">
        <UBadge
          :color="ticket.checkin_at ? 'success' : 'neutral'"
          variant="subtle"
          size="sm"
        >
          {{ ticket.checkin_at ? 'Sudah check-in' : 'Belum check-in' }}
        </UBadge>
        <UIcon
          name="i-lucide-chevron-down"
          class="transition-transform"
          :class="{ 'rotate-180': false }"
        />
      </span>
    </UButton>

    <template #content>
      <div class="p-4 pt-0 border-t border-outline space-y-4">
        <div class="grid gap-2 text-sm">
          <div class="flex gap-2">
            <span class="text-on-surface-variant w-24">Email</span>
            <span class="text-on-surface break-all">
              {{ ticket.attendee_email || '-' }}
            </span>
          </div>
          <div class="flex gap-2">
            <span class="text-on-surface-variant w-24">Telepon</span>
            <span class="text-on-surface">{{
              ticket.attendee_phone || '-'
            }}</span>
          </div>
        </div>

        <div v-if="fieldsEntries.length > 0" class="grid gap-2 text-sm">
          <div
            v-for="[key, value] in fieldsEntries"
            :key="key"
            class="flex gap-2"
          >
            <span class="text-on-surface-variant w-24 capitalize">
              {{ key.replaceAll('_', ' ') }}
            </span>
            <span class="text-on-surface">{{ value }}</span>
          </div>
        </div>

        <div
          v-if="ticketQrEnabled"
          class="flex flex-col items-center gap-2 py-2"
        >
          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            alt="QR kode tiket"
            class="size-48 rounded-lg border border-outline bg-white p-2"
          />
          <p v-else-if="qrFailed" class="text-sm text-error">
            Gagal memuat QR kode.
          </p>
          <USpinner v-else class="size-6" />
          <p
            class="text-xs font-mono text-on-surface-variant break-all text-center"
          >
            {{ ticket.token }}
          </p>
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
