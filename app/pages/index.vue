<script setup lang="ts">
useSeoMeta({
  title: 'Bursa Kerja FPCE - RSVP Acara',
  description:
    'Jelajahi sesi bursa kerja FPCE mendatang, presentasi perusahaan, dan lakukan RSVP secara langsung.',
})

const supabase = useSupabaseClient()
const { data: events, error } = await supabase.from('events').select('*')
</script>

<template>
  <div class="py-10 space-y-12">
    <!-- Hero Banner -->
    <section class="text-center space-y-4 max-w-3xl mx-auto px-4">
      <h1
        class="text-4xl md:text-5xl font-bold tracking-tight text-on-background"
      >
        Acara terbaru
      </h1>
      <p class="text-lg text-on-surface-variant">
        Acara terbaru dari GembiraTix
      </p>
    </section>

    <!-- Event List Grid -->
    <section class="max-w-6xl mx-auto px-4">
      <header class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-on-surface">Sesi Tersedia</h2>
        <p class="text-sm text-on-surface-variant">
          Menampilkan {{ events?.length }} acara
        </p>
      </header>

      <div
        v-if="events && events.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <UCard
          v-for="event in events"
          :key="event.id"
          class="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow duration-200"
          :ui="{ body: 'p-5 flex-1 flex flex-col justify-between' }"
        >
          <figure
            class="relative h-44 -mx-5 -mt-5 mb-4 overflow-hidden bg-surface-container"
          >
            <img
              v-if="event.image_url"
              :src="event.image_url"
              :alt="event.title"
              class="w-full h-full object-cover"
            />
          </figure>

          <figcaption class="space-y-1.5 text-xs text-on-surface-variant mb-3">
            <h3 class="text-lg font-bold text-on-surface mb-2 line-clamp-2">
              {{ event.title }}
            </h3>

            <div v-if="event.starts_at" class="flex items-center gap-1.5">
              <UIcon name="i-lucide-calendar" class="w-4 h-4 text-primary" />
              <span>{{ formatDate(event.starts_at) }} WIB</span>
            </div>
          </figcaption>

          <p class="text-sm text-on-surface-variant line-clamp-3 mb-4">
            {{ event.description }}
          </p>

          <div
            class="pt-4 border-t border-outline flex items-center justify-between"
          >
            <UButton
              :to="`/e/${event.slug}`"
              color="primary"
              variant="solid"
              class="w-full justify-center"
              trailing-icon="i-lucide-arrow-right"
            >
              Lihat & RSVP
            </UButton>
          </div>
        </UCard>
      </div>
    </section>
  </div>
</template>
