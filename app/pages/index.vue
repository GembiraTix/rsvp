<script setup lang="ts">
import { useEvents } from '@/composables/useEvents'

useSeoMeta({
  title: 'Selamat Datang - GembiraTix',
  description: 'Jelajahi acara di GembiraTix.',
})

const { fetchAll } = useEvents()
const { data: res, error } = await fetchAll({ withDraft: false })
const events = computed(() => res.value?.data || [])
</script>

<template>
  <div class="py-10 space-y-12">
    <section class="text-center space-y-4 max-w-3xl mx-auto px-4">
      <h1
        class="text-4xl md:text-5xl font-bold tracking-tight text-on-background"
      >
        Acara terbaru
      </h1>
      <p class="text-lg text-on-surface-variant">
        Lihat berbagai acara terbaru
      </p>
    </section>

    <div v-if="error" class="max-w-6xl mx-auto px-4 text-red-500">
      Gagal memuat acara: {{ error.message }}
    </div>

    <section class="max-w-6xl mx-auto px-4">
      <header class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-on-surface">Sesi Tersedia</h2>
        <p class="text-sm text-on-surface-variant">
          Menampilkan {{ events.length }} acara
        </p>
      </header>

      <div
        v-if="events.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <HomeEvent
          v-for="event in events"
          :key="event.id"
          :event="event"
        />
      </div>
    </section>
  </div>
</template>
