<script setup lang="ts">
import { useEvents } from '@/composables/useEvents'
import { useRsvp } from '@/composables/useRsvp'
import { useTicketTypes } from '@/composables/useTicketTypes'

const route = useRoute()
const eventSlug = computed(() => route.params.slug as string)

const { fetchProfile } = useUserProfile()
const { data: profileRes } = await fetchProfile()
const profile = computed(() => profileRes.value?.data || null)

const { fetchBySlug } = useEvents()
const { data: eventRes, error } = await fetchBySlug(eventSlug)

if (error.value || !eventRes.value?.data) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Acara tidak ditemukan',
  })
}

const event = computed(() => eventRes.value!.data)

const { fetchPublicByEvent } = useTicketTypes()
const { data: ticketTypesRes } = await fetchPublicByEvent(eventSlug)
const ticketTypes = computed(() => ticketTypesRes.value?.data ?? [])
const hasTickets = computed(() => ticketTypes.value.length > 0)
const lowestPrice = computed(() =>
  hasTickets.value
    ? Math.min(...ticketTypes.value.map((tt) => tt.price))
    : null,
)

const isAdmin = computed(
  () => profile.value && ['admin', 'super_admin'].includes(profile.value.role),
)

const { fetchAttendingCount, getRsvpByEventAndEmail } = useRsvp()
const { data: rsvpCountRes } = await fetchAttendingCount(event.value.id)

const attendingCount = computed(() => rsvpCountRes.value?.data.count ?? 0)

const isLimitReached = computed(() => {
  if (!event.value?.registration_limit) return false
  return attendingCount.value >= event.value.registration_limit
})

useSeoMeta({
  title: () => `${event.value?.title || 'Acara'} - RSVP`,
  description: () => event.value?.description || '',
})

const {
  data: existingRsvp,
  refresh: refreshExistingRsvp,
} = await useAsyncData(`event-rsvp-${event.value.id}-${profile.value?.email}`, () =>
  getRsvpByEventAndEmail(event.value.id, profile.value?.email ?? ''),
)

const rsvpToken = computed(() => existingRsvp.value?.token ?? '')

const isRegistered = computed(() => existingRsvp.value?.is_attending ?? false)

async function handleRegistered() {
  await refreshExistingRsvp()
}

const sidebarPanel = computed(() =>
  resolveEventSidebarPanel({
    isRegistered: isRegistered.value,
    isLimitReached: isLimitReached.value,
    hasTickets: hasTickets.value,
    isLoggedIn: Boolean(profile.value),
  }),
)
</script>

<template>
  <div class="py-8 max-w-5xl mx-auto px-4 space-y-8">
    <UButton to="/" variant="ghost" color="neutral" icon="i-lucide-arrow-left">
      Kembali ke semua acara
    </UButton>

    <div v-if="error">
      {{ error }}
    </div>

    <div
      v-if="event"
      class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
    >
      <!-- Event Info (Left Column) -->
      <section class="lg:col-span-7 space-y-6">
        <figure
          class="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 h-64 md:h-80"
        >
          <img
            :src="event.image_url"
            :alt="event.title"
            class="w-full h-full object-cover"
          />
        </figure>

        <div class="space-y-4">
          <h1 class="text-3xl font-bold text-on-surface">
            {{ event.title }}
          </h1>

          <article
            class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-surface-container border border-outline text-sm"
          >
            <time
              v-if="event.starts_at"
              :datetime="event.starts_at"
              class="flex items-center gap-2 text-on-surface-variant"
            >
              <UIcon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
              <span>{{ formatDate(event.starts_at) }}</span>
            </time>
            <div class="flex items-center gap-2 text-on-surface-variant">
              <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-primary" />
              <span>{{ event.location }}</span>
            </div>
          </article>

          <article class="space-y-2">
            <h2 class="text-xl font-bold text-on-surface">Tentang Sesi Ini</h2>
            <p
              class="text-on-surface-variant leading-relaxed whitespace-pre-line"
            >
              {{ event.description }}
            </p>
          </article>
        </div>
      </section>

      <section class="lg:col-span-5 space-y-6">
        <UCard
          v-if="isAdmin"
          class="shadow-xl border-outline"
          :ui="{ body: 'p-6 space-y-4 text-center py-2' }"
        >
          <h2 class="text-xl font-bold text-on-surface">Kelola Acara Anda</h2>
          <p>Sunting detil acara, atau kelola peserta</p>

          <UButton
            :to="`/e/${event.slug}/edit`"
            variant="outline"
            size="lg"
            icon="i-lucide-pencil"
            class="w-full justify-center font-bold"
            label="Edit detil acara"
          />
          <UButton
            :to="`/e/${event.slug}/manage`"
            color="primary"
            size="lg"
            class="w-full justify-center font-bold"
            icon="i-lucide-settings"
            label="Kelola Acara & Peserta"
          />
        </UCard>

        <UCard
          class="sticky top-20 shadow-xl border-outline"
          :ui="{ body: 'p-6 space-y-6' }"
        >
          <div
            v-if="sidebarPanel === 'confirmed'"
            class="space-y-4 text-center py-4"
          >
            <div
              class="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto"
            >
              <UIcon name="i-lucide-check" class="w-6 h-6" />
            </div>

            <h2 class="text-xl font-bold text-on-surface">
              RSVP Terkonfirmasi!
            </h2>
            <p class="text-on-surface-variant">
              Anda telah terdaftar untuk sesi ini.
            </p>

            <div
              class="p-3 bg-surface-container rounded-lg text-on-surface-variant space-y-1"
            >
              <UButton
                :to="`/rsvp/${rsvpToken}`"
                color="neutral"
                variant="outline"
                class="w-full justify-center"
              >
                Lihat / Kelola RSVP Saya
              </UButton>
              <UButton
                to="/"
                color="primary"
                variant="ghost"
                class="w-full justify-center"
              >
                Jelajahi Acara Lain
              </UButton>
            </div>
          </div>

          <template v-else-if="sidebarPanel === 'quota_full'">
            <header>
              <h3 class="text-xl font-bold text-on-surface">Kuota penuh</h3>

              <p class="text-on-surface-variant mt-0.5">
                Batas pendaftaran untuk acara ini telah tercapai. Silakan
                hubungi penyelenggara untuk informasi selanjutnya.
              </p>
            </header>
          </template>

          <div v-else-if="sidebarPanel === 'buy_tickets'" class="space-y-3">
            <header class="flex justify-between">
              <h2 class="text-xl font-bold text-on-surface">Beli tiket</h2>
              <p class="text-on-surface-variant">
                Mulai dari
                <span class="font-bold text-on-surface">
                  {{ formatRupiah(lowestPrice ?? 0) }}
                </span>
              </p>
            </header>

            <UButton
              :to="`/e/${event.slug}/tickets`"
              color="primary"
              size="xl"
              label="Beli Tiket"
              icon="i-lucide-ticket"
              block
            />
          </div>

          <!-- authenticated RSVP -->
          <template v-else-if="sidebarPanel === 'rsvp_form'">
            <EventRsvpForm
              mode="authenticated"
              :event-id="event.id"
              :event-title="event.title"
              :profile="profile"
              @registered="handleRegistered"
            />
          </template>

          <!-- Guest Form State -->
          <template v-else>
            <EventRsvpForm
              mode="guest"
              :event-id="event.id"
              :event-title="event.title"
              :profile="profile"
              @registered="handleRegistered"
            />
          </template>
        </UCard>
      </section>
    </div>
  </div>
</template>
