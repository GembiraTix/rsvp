<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

const formStateSchema = z.object({
  email: z.email('invalid email.').nonempty(),
  password: z.string().nonempty(),
})

type FormState = z.output<typeof formStateSchema>

const formState = ref<FormState>({
  email: '',
  password: '',
})

function handleLogin(e: FormSubmitEvent<FormState>) {
  console.log(e.data)
}
</script>

<template>
  <div class="flex flex-col justify-center max-w-prose mx-auto gap-4 py-8">
    <header>
      <h1 class="text-2xl font-bold">Welcome back</h1>
      <p>Log in to your appname account</p>
    </header>

    <UForm
      :schema="formStateSchema"
      :state="formState"
      @submit="handleLogin"
      class="grid gap-4"
    >
      <UFormField label="email">
        <UInput
          v-model="formState.email"
          placeholder="your email"
          id="email"
          name="email"
          type="email"
          class="w-full"
          required
        />
      </UFormField>

      <UFormField label="password">
        <UInput
          v-model="formState.password"
          placeholder="your super secret password"
          id="password"
          name="password"
          type="password"
          class="w-full"
          required
        />
      </UFormField>

      <UButton label="Submit" type="submit" size="lg" class="justify-center" />
    </UForm>
  </div>
</template>
