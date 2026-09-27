<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Dasbor Saya - Bursa Kerja FPCE',
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

watch(
  user,
  () => {
    if (!user.value) return navigateTo('/login')
  },
  { immediate: true },
)

import { useUserProfile } from '@/composables/useUserProfile'

const { fetchProfile, updateProfile: apiUpdateProfile } = useUserProfile()
const { data: profileRes, refresh: refreshProfile } = await fetchProfile()
const profile = computed(() => profileRes.value?.data || null)

const isUpdatingProfile = ref(false)
const profileErrorMessage = ref('')
const profileSuccessMessage = ref('')

const profileFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.'),
})

type ProfileFormState = z.output<typeof profileFormSchema>

const profileFormState = reactive<ProfileFormState>({
  name: profile.value?.name || '',
})

async function handleUpdateProfile(e: FormSubmitEvent<ProfileFormState>) {
  if (!user.value) return
  isUpdatingProfile.value = true
  profileErrorMessage.value = ''
  profileSuccessMessage.value = ''

  try {
    await apiUpdateProfile(e.data.name)
    await refreshProfile()
    profileSuccessMessage.value = 'Profil berhasil diperbarui!'
  } catch (err: unknown) {
    if (err instanceof Error) {
      profileErrorMessage.value = err.message
    } else {
      profileErrorMessage.value = 'Gagal memperbarui profil.'
    }
  } finally {
    isUpdatingProfile.value = false
  }
}

import { useEvents } from '@/composables/useEvents'

const { fetchCreatedByUser, deleteEvent: apiDeleteEvent } = useEvents()
const userId = computed(() => user.value?.sub || user.value?.id)

const { data: organizedRes, refresh: refreshOrganized } =
  await fetchCreatedByUser(userId)
const organizedEvents = computed(() => organizedRes.value?.data || [])

// Fetch RSVPs joined by this user
const { data: joinedRsvps, refresh: refreshJoined } = await useAsyncData(
  `joined-rsvps-${user.value?.email}`,
  async () => {
    if (!user.value?.email) return []
    const { data, error } = await supabase
      .from('rsvps')
      .select('id, token, is_attending, created_at, events (*)')
      .eq('email', user.value.email)
      .eq('is_attending', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },
)

async function deleteEvent(id: number) {
  if (!confirm('Apakah Anda yakin ingin menghapus acara ini?')) return
  try {
    await apiDeleteEvent(id)
    await refreshOrganized()
    await refreshJoined()
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Gagal menghapus acara.')
  }
}
</script>

<template>
  <div class="py-8 max-w-6xl mx-auto px-4 space-y-10">
    <UCard class="border-outline bg-surface-container/50">
      <header
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-full bg-primary/20 text-primary font-bold text-xl flex items-center justify-center shrink-0"
          >
            {{ (profile?.name || user?.email || 'U').charAt(0).toUpperCase() }}
          </div>

          <div>
            <h2 class="text-xl font-bold text-on-surface">
              {{ profile?.name || 'Profil Pengguna' }}
            </h2>
            <p class="text-sm text-on-surface-variant">
              {{ user?.email }}
            </p>
          </div>
        </div>

        <UModal
          title="Pengaturan Edit Profil"
          description="Perbarui nama tampilan dan detail profil Anda."
          :close="{ color: 'primary' }"
        >
          <UButton color="neutral" variant="outline" icon="i-lucide-user-cog">
            Edit Profil
          </UButton>
          <template #body>
            <UAlert
              v-if="profileErrorMessage"
              :title="profileErrorMessage"
              icon="i-lucide-alert-circle"
              color="error"
              variant="subtle"
            />

            <UAlert
              v-if="profileSuccessMessage"
              :title="profileSuccessMessage"
              icon="i-lucide-check-circle"
              color="success"
              variant="subtle"
            />

            <UForm
              :schema="profileFormSchema"
              :state="profileFormState"
              class="space-y-4"
              @submit="handleUpdateProfile"
            >
              <UFormField label="Email">
                <UInput :model-value="user?.email" disabled class="w-full" />
              </UFormField>

              <UFormField label="Nama Lengkap / Nama Tampilan" name="name">
                <UInput
                  id="name"
                  v-model="profileFormState.name"
                  placeholder="contoh: Dr. Jane Doe"
                  name="name"
                  class="w-full"
                />
              </UFormField>

              <div class="pt-4 flex justify-end gap-2">
                <UButton
                  color="primary"
                  type="submit"
                  :loading="isUpdatingProfile"
                >
                  Simpan Perubahan
                </UButton>
              </div>
            </UForm>
          </template>
        </UModal>
      </header>
    </UCard>

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
          <UIcon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
          Acara Anda ({{ organizedEvents?.length || 0 }})
        </h2>

        <div class="flex items-center gap-3">
          <UButton to="/users/events/new" color="primary" icon="i-lucide-plus">
            Buat Acara Baru
          </UButton>
        </div>
      </div>

      <UCard class="border-outline" :ui="{ body: 'p-0 sm:p-0' }">
        <div
          v-if="organizedEvents && organizedEvents.length > 0"
          class="overflow-x-auto"
        >
          <table class="w-full text-left">
            <thead
              class="bg-surface-container border-b border-outline text-xs font-semibold text-on-surface-variant uppercase"
            >
              <tr>
                <th class="px-6 py-3">Judul Acara</th>
                <th class="px-6 py-3">Tanggal</th>
                <th class="px-6 py-3">Lokasi</th>
                <th class="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline">
              <tr
                v-for="ev in organizedEvents"
                :key="ev.id"
                class="hover:bg-surface-container/50"
              >
                <td class="px-6 py-4 font-medium text-on-surface">
                  {{ ev.title }}
                </td>
                <td class="px-6 py-4 text-on-surface-variant">
                  <span v-if="ev.starts_at">{{
                    formatDate(ev.starts_at)
                  }}</span>
                  <span v-else>-</span>
                </td>
                <td class="px-6 py-4 text-on-surface-variant">
                  {{ ev.location || '-' }}
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                  <UButton
                    :to="`/e/${ev.slug}/manage`"
                    variant="soft"
                    icon="i-lucide-settings"
                  >
                    Kelola
                  </UButton>
                  <UButton
                    :to="`/e/${ev.slug}`"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-external-link"
                    title="Lihat halaman publik"
                  />
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    title="Hapus acara"
                    @click="deleteEvent(ev.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="p-8 text-center space-y-3">
          <UIcon
            name="i-lucide-calendar-plus"
            class="w-10 h-10 mx-auto text-on-surface-variant"
          />
          <p class="text-sm text-on-surface-variant">
            Anda belum mengorganisasi acara apa pun.
          </p>
          <UButton
            to="/users/events/new"
            color="primary"
            variant="outline"
            size="sm"
          >
            Buat Acara Pertama Anda
          </UButton>
        </div>
      </UCard>
    </section>

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
          <UIcon name="i-lucide-ticket" class="w-5 h-5 text-primary" />
          Acara Yang Anda Ikuti ({{ joinedRsvps?.length || 0 }})
        </h2>
      </div>

      <UCard class="border-outline" :ui="{ body: 'p-0 sm:p-0' }">
        <div
          v-if="joinedRsvps && joinedRsvps.length > 0"
          class="overflow-x-auto"
        >
          <table class="w-full text-left text-sm">
            <thead
              class="bg-surface-container border-b border-outline text-xs font-semibold text-on-surface-variant uppercase"
            >
              <tr>
                <th class="px-6 py-3">Acara</th>
                <th class="px-6 py-3">Lokasi</th>
                <th class="px-6 py-3">Ref RSVP</th>
                <th class="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline">
              <tr
                v-for="rsvp in joinedRsvps"
                :key="rsvp.id"
                class="hover:bg-surface-container/50"
              >
                <td class="px-6 py-4 font-medium text-on-surface">
                  {{ rsvp.events?.title || 'Acara' }}
                </td>
                <td class="px-6 py-4 text-on-surface-variant">
                  {{ rsvp.events?.location || '-' }}
                </td>
                <td class="px-6 py-4 text-xs font-mono text-on-surface-variant">
                  {{ rsvp.token.slice(0, 8) }}...
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                  <UButton
                    :to="`/rsvp/${rsvp.token}`"
                    size="xs"
                    color="neutral"
                    variant="outline"
                  >
                    Lihat Tiket
                  </UButton>
                  <UButton
                    v-if="rsvp.events?.slug"
                    :to="`/e/${rsvp.events.slug}`"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-external-link"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="p-8 text-center space-y-3">
          <UIcon
            name="i-lucide-ticket-slash"
            class="w-10 h-10 mx-auto text-on-surface-variant"
          />
          <p class="text-sm text-on-surface-variant">
            Anda belum mengikuti acara apa pun.
          </p>
          <UButton to="/" color="neutral" variant="outline" size="sm">
            Jelajahi Acara Publik
          </UButton>
        </div>
      </UCard>
    </section>
  </div>
</template>
