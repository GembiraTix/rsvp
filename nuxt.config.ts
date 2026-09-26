// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'RSVP',
      htmlAttrs: { lang: 'id' },
    },
  },
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/supabase'],
  supabase: {
    redirect: false,
  },

  runtimeConfig: {
    public: {
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || 'Bursa Kerja FPCE',
    },

    resendApiKey: process.env.NUXT_RESEND_API_KEY,
  },

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true },
  },

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
