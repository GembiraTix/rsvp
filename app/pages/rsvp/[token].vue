<script setup lang="ts">
import { useRsvp } from '@/composables/useRsvp'

const route = useRoute()
const token = computed(() => route.params.token as string)

const { fetchByToken } = useRsvp()
const { data: rsvp, error } = await fetchByToken(token)

import { useSiteName } from '@/composables/useSiteName'
const siteName = useSiteName()

useSeoMeta({
  title: `Kelola RSVP - ${siteName}`,
})
</script>

<template>
  <div class="py-12 max-w-xl mx-auto px-4 space-y-6">
    <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-arrow-left">
      Kembali ke Beranda
    </UButton>

    <div
      v-if="error || !rsvp"
      class="p-6 text-center rounded-xl bg-error-50 dark:bg-error-950/30 text-error-700 dark:text-error-300"
    >
      <UIcon name="i-lucide-alert-circle" class="w-8 h-8 mx-auto mb-2" />
      <h2 class="text-lg font-bold">Reservasi Tidak Ditemukan</h2>
      <p class="text-xs text-on-surface-variant mt-1">
        Silakan periksa tautan reservasi Anda dan coba lagi.
      </p>
    </div>

    <UCard v-else class="border-outline shadow-md">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-on-surface">Detail Reservasi</h1>
            <p class="text-xs text-on-surface-variant font-mono">
              Ref: {{ token }}
            </p>
          </div>

          <UBadge
            :color="rsvp.is_attending ? 'primary' : 'error'"
            variant="subtle"
            size="md"
          >
            {{ rsvp.is_attending ? 'Terkonfirmasi' : 'Dibatalkan' }}
          </UBadge>
        </div>
      </template>

      <div class="space-y-6">
        <div
          v-if="rsvp.events"
          class="p-4 rounded-xl bg-surface-container border border-outline space-y-2"
        >
          <p class="font-semibold text-primary uppercase tracking-wide">
            Informasi Acara
          </p>
          <h2 class="font-bold text-on-surface">
            {{ rsvp.events.title }}
          </h2>
          <div class="text-on-surface-variant space-y-1">
            <time
              :datetime="rsvp.events.starts_at"
              v-if="rsvp.events.starts_at"
            >
              {{ formatDate(rsvp.events.starts_at) }}
            </time>
            <p v-if="rsvp.events.location">{{ rsvp.events.location }}</p>
          </div>
        </div>

        <div class="space-y-3 text-sm">
          <div>
            <span class="text-on-surface-variant block">Nama Peserta</span>
            <span class="font-medium text-on-surface">{{ rsvp.name }}</span>
          </div>
          <div>
            <span class="text-on-surface-variant block">Email</span>
            <span class="font-medium text-on-surface">{{ rsvp.email }}</span>
          </div>

          <div v-if="rsvp.organization">
            <span class="text-on-surface-variant block">
              Organisasi / Latar Belakang
            </span>
            <p class="text-medium mt-0.5 whitespace-pre-line">
              {{ rsvp.organization }}
            </p>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
