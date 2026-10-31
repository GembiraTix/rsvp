// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  vite: {
    server: {
      allowedHosts: ['gembiratix.munthe.dev'],
    },
  },
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

    midtransServerKey: process.env.MIDTRANS_SERVER_KEY,
    midtransClientKey: process.env.MIDTRANS_CLIENT_KEY,
    midtransIsProduction: process.env.MIDTRANS_IS_PRODUCTION,
  },

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: false,
    },
  },
})
