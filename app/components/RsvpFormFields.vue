<script setup lang="ts">
const props = defineProps<{
  customQuestionLabel?: string | null
  customQuestionRequired?: boolean
  identityTypeItems: { label: string; value: string }[]
  genderItems: { label: string; value: string }[]
}>()

const name = defineModel<string>('name', { required: true })
const email = defineModel<string>('email', { required: true })
const customQuestionAnswer = defineModel<string>('customQuestionAnswer')
const identityType = defineModel<string>('identityType')
const identityNumber = defineModel<string>('identityNumber')
const whatsapp = defineModel<string>('whatsapp')
const gender = defineModel<string>('gender')
</script>

<template>
  <UFormField
    label="Nama lengkap"
    name="name"
    class="space-y-1.5"
    required
  >
    <UInput
      v-model="name"
      placeholder="Andi Johan"
      required
      class="w-full"
    />
  </UFormField>

  <UFormField
    label="Alamat email"
    name="email"
    class="space-y-1.5"
    required
  >
    <UInput
      v-model="email"
      type="email"
      placeholder="andi@example.com"
      required
      class="w-full"
    />
  </UFormField>

  <UFormField
    v-if="props.customQuestionLabel"
    :label="props.customQuestionLabel"
    name="customQuestionAnswer"
    class="space-y-1.5"
    :required="props.customQuestionRequired"
  >
    <UInput v-model="customQuestionAnswer" class="w-full" />
  </UFormField>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <UFormField label="Tipe identitas" name="identityType" class="space-y-1.5">
      <USelect
        v-model="identityType"
        :items="props.identityTypeItems"
        placeholder="Opsional"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Nomor identitas"
      name="identityNumber"
      class="space-y-1.5"
    >
      <UInput v-model="identityNumber" class="w-full" />
    </UFormField>

    <UFormField label="No. WhatsApp" name="whatsapp" class="space-y-1.5">
      <UInput
        v-model="whatsapp"
        type="tel"
        placeholder="0812xxxxxxx"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Jenis kelamin" name="gender" class="space-y-1.5">
      <USelect
        v-model="gender"
        :items="props.genderItems"
        placeholder="Opsional"
        class="w-full"
      />
    </UFormField>
  </div>
</template>
