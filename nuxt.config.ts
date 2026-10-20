// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'RSVP',
      htmlAttrs: { lang: 'id' },
    },
  },
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/supabase'],
  colorMode: {
    preference: 'light',
  },
  supabase: {
    redirect: false,
  },

  runtimeConfig: {
    public: {
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || 'Bursa Kerja FPCE',
    },

    resendApiKey: process.env.NUXT_RESEND_API_KEY,
    emailFrom: process.env.NUXT_EMAIL_FROM,
  },

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs',
      },
    },
  },
})
