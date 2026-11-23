<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'

const description = defineModel<string>({ default: '' })

const toolbarItems: EditorToolbarItem[][] = [
  [
    { kind: 'undo', icon: 'i-lucide-undo', tooltip: { text: 'Urungkan' } },
    { kind: 'redo', icon: 'i-lucide-redo', tooltip: { text: 'Ulangi' } },
  ],
  [
    {
      kind: 'mark',
      mark: 'bold',
      icon: 'i-lucide-bold',
      tooltip: { text: 'Tebal' },
    },
    {
      kind: 'mark',
      mark: 'italic',
      icon: 'i-lucide-italic',
      tooltip: { text: 'Miring' },
    },
    {
      kind: 'mark',
      mark: 'strike',
      icon: 'i-lucide-strikethrough',
      tooltip: { text: 'Dicoret' },
    },
    {
      kind: 'mark',
      mark: 'code',
      icon: 'i-lucide-code',
      tooltip: { text: 'Kode' },
    },
  ],
  [
    {
      kind: 'heading',
      level: 2,
      icon: 'i-lucide-heading-2',
      tooltip: { text: 'Judul' },
    },
    {
      kind: 'heading',
      level: 3,
      icon: 'i-lucide-heading-3',
      tooltip: { text: 'Sub-judul' },
    },
    {
      kind: 'bulletList',
      icon: 'i-lucide-list',
      tooltip: { text: 'Daftar poin' },
    },
    {
      kind: 'orderedList',
      icon: 'i-lucide-list-ordered',
      tooltip: { text: 'Daftar bernomor' },
    },
  ],
  [
    {
      kind: 'blockquote',
      icon: 'i-lucide-text-quote',
      tooltip: { text: 'Kutipan' },
    },
    {
      kind: 'horizontalRule',
      icon: 'i-lucide-separator-horizontal',
      tooltip: { text: 'Garis pemisah' },
    },
  ],
  [{ kind: 'link', icon: 'i-lucide-link', tooltip: { text: 'Tautan' } }],
]
</script>

<template>
  <UEditor
    v-slot="{ editor }"
    v-model="description"
    content-type="markdown"
    :image="false"
    :starter-kit="{ heading: { levels: [2, 3] } }"
    :placeholder="{
      placeholder:
        'Detail mengenai persyaratan, agenda, kelayakan, dan pembicara...',
      mode: 'firstLine',
    }"
    :ui="{ base: 'px-3 py-2 sm:px-3' }"
    class="w-full min-h-40 rounded-md bg-default ring ring-inset ring-accented focus-within:outline-3 focus-within:outline-primary/25 focus-within:ring-primary"
  >
    <UEditorToolbar
      :editor="editor"
      :items="toolbarItems"
      class="border-b border-muted px-2 py-1.5 overflow-x-auto"
    />
  </UEditor>
</template>
