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
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
  ],
  colorMode: {
    preference: 'light',
  },
  supabase: {
    redirect: false,
  },

  site: {
    url: 'https://gembiratix.my.id',
    name: 'GembiraTix',
  },

  sitemap: {
    excludeAppSources: true,
    sources: ['/api/__sitemap__/urls'],
  },

  robots: {
    disallow: [
      '/api',
      '/admin',
      '/users',
      '/rsvp',
      '/login',
      '/signup',
      '/confirm',
      '/e/*/checkout',
      '/e/*/register',
      '/e/*/manage',
      '/e/*/edit',
    ],
  },

  routeRules: {
    '/admin/**': { appLayout: 'admin' },
    '/login': {
      prerender: true,
    },
    '/signup': {
      prerender: true,
    },
  },

  runtimeConfig: {
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      ticketQrEnabled: process.env.NUXT_PUBLIC_TICKET_QR_ENABLED === 'true',
      paymentsEnabled: process.env.NUXT_PUBLIC_PAYMENTS_ENABLED === 'true',
    },
    resendApiKey: process.env.NUXT_RESEND_API_KEY,
    resendWebhookSecret: process.env.NUXT_RESEND_WEBHOOK_SECRET,
    emailFrom: process.env.NUXT_EMAIL_FROM,
    emailProvider: process.env.NUXT_EMAIL_PROVIDER || 'resend',
    smtpHost: process.env.NUXT_SMTP_HOST || 'localhost',
    smtpPort: Number(process.env.NUXT_SMTP_PORT || 54325),

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
