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
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      ticketQrEnabled: process.env.NUXT_PUBLIC_TICKET_QR_ENABLED === 'true',
    },

    resendApiKey: process.env.NUXT_RESEND_API_KEY,
    resendWebhookSecret: process.env.NUXT_RESEND_WEBHOOK_SECRET,
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
