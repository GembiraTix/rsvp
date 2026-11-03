<script setup lang="ts">
const props = defineProps<{ title: string }>()

const canShare = ref(false)
const isPopoverOpen = ref(false)
const isCopied = ref(false)

let copiedTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  canShare.value = typeof navigator.share === 'function'
})

onUnmounted(() => clearTimeout(copiedTimer))

async function share() {
  try {
    await navigator.share({ title: props.title, url: window.location.href })
  } catch {
    // user dismissed the share sheet
  }
}

function legacyCopy(text: string) {
  const el = document.createElement('textarea')
  el.value = text
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  el.remove()
}

async function copyLink() {
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    legacyCopy(url)
  }
  isCopied.value = true
  copiedTimer = setTimeout(() => (isCopied.value = false), 2000)
  isPopoverOpen.value = false
}
</script>

<template>
  <UButton
    v-if="canShare"
    icon="i-lucide-share-2"
    color="neutral"
    variant="outline"
    aria-label="Bagikan acara"
    @click="share"
  />

  <UPopover v-else v-model:open="isPopoverOpen">
    <UButton
      icon="i-lucide-share-2"
      color="neutral"
      variant="outline"
      aria-label="Bagikan acara"
    />

    <template #content>
      <UButton
        :icon="isCopied ? 'i-lucide-check' : 'i-lucide-link'"
        :label="isCopied ? 'Tersalin' : 'Salin tautan'"
        :color="isCopied ? 'success' : 'neutral'"
        variant="ghost"
        block
        @click="copyLink"
      />
    </template>
  </UPopover>
</template>
