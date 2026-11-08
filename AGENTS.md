# AGENTS.md

Context for AI coding agents working in this repo.

## Project

GembiraTix — event RSVP + paid ticketing app. All UI copy, error messages, dates (`id-ID`, Asia/Jakarta) and currency (IDR via `formatRupiah`) are in Bahasa Indonesia.

Stack: Nuxt 4 (SSR), Nuxt UI v4 + Tailwind CSS v4, Supabase (Postgres, Auth, Storage), Midtrans Snap (payments), Resend (email), zod (validation). Deployed at `gembiratix.my.id`.

## Commands

Package manager is **pnpm** (Node 22 in CI).

- `pnpm dev` — dev server on http://localhost:3000
- `pnpm lint` — ESLint
- `pnpm typecheck` — `nuxt typecheck` (vue-tsc)
- `pnpm format` — Prettier

There are no tests. Before considering work done, `pnpm lint` and `pnpm typecheck` must pass — that's exactly what CI runs.

Supabase CLI (devDependency; local stack on ports 54321/54322, Postgres 17):

- `pnpm supabase start` / `pnpm supabase stop` — local stack
- `pnpm supabase db reset` — recreate local DB from migrations
- `pnpm supabase db push` — apply migrations to the linked remote
- Regenerate types after any schema change (never hand-edit `app/types/database.types.ts`):
  `pnpm supabase gen types typescript --local > app/types/database.types.ts`

## Layout

Nuxt 4 directory layout (`app/` srcDir — there is no root `pages/`):

- `app/` — pages, components, composables, middleware, utils, `types/database.types.ts` (generated Supabase types)
- `server/` — Nitro: `api/` (route handlers), `middleware/`, `domain/types.ts` (domain entities), `repositories/`, `services/`, `utils/` (service factories)
- `shared/` — code importable from both app and server
- `supabase/` — `config.toml`, `migrations/`, `templates/`
- `.kilo/plans/*.md` — prior design notes (checkout flow, casing convention); useful background

## Server architecture

Strict layering; every new backend feature follows it:

**API handler → service → repository**

- `server/api/**` handlers stay thin: validate input with zod (`readValidatedBody`), check `event.context.auth`, call a service, return `{ success: true, data }`. No `client.from()` calls here.
- `server/services/*.service.ts` — business logic; ownership and role checks live here, errors thrown as `createError` with Indonesian messages.
- `server/repositories/supabase-*.repository.ts` — the only place that queries Supabase (`client.from(...)`), implementing `repositories/interfaces.ts`.
- `server/utils/*-service.ts` — Nitro-auto-imported factories (`useEventService(event)` etc.) wiring `serverSupabaseClient` → repo → service. Add one per new service.
- `server/domain/types.ts` — domain types; the frontend imports them from `~~/server/domain/types`.

## Auth & roles

- `@nuxtjs/supabase` is configured with `redirect: false` — there are NO automatic auth redirects. Guarding is manual:
  - Pages: `definePageMeta({ middleware: 'auth' })` (`app/middleware/auth.ts` → `/login?redirectTo=...`).
  - API: `server/middleware/auth.ts` populates `event.context.auth = { user, role }` on every request; handlers check it and throw 401/403.
- Roles: `user` | `admin` | `super_admin` on `users.role`, injected into the JWT by the `custom_access_token_hook` DB function (must stay enabled in the Supabase dashboard). RLS helper: `public.is_admin()`.
- Server-side clients: `serverSupabaseClient(event)` (user cookie context) everywhere; `serverSupabaseServiceRole(event)` only for admin user management (`auth.admin.*` in `server/api/admin/**`).

## Database

- RLS is enabled on every table; any new table needs policies in its migration.
- Schema changes = a new file in `supabase/migrations/` (never edit an applied migration), then regenerate types.
- Tables: `events`, `users`, `rsvps`, `confirmation_emails`, `ticket_types`, `orders`, `order_items`, `tickets`, plus `event_payment_settings` and `payment_events` (reserved, not used by app code yet).
- Storage: single public bucket `event-banners`; uploads go through `POST /api/events/upload` (server-side, magic-byte validated via `shared/utils/imageValidation.ts`).
- No RPC/views; plain table queries only.

## Casing convention

- snake_case: DB columns, migrations, repositories, `server/domain/types.ts`, API responses.
- camelCase: request bodies, zod schemas, service inputs (`CreateOrderInput`), frontend form state.
- Services map between the two (see `server/services/event.service.ts`).

## Frontend conventions

- All API access goes through composables in `app/composables/` — `useFetch` for SSR reads, `$fetch` for mutations, returning the `{ success, data }` envelope. Pages never call `/api` directly. (A few older pages query the `rsvps` table via `useSupabaseClient()` directly — existing debt; don't add more.)
- No Pinia, no `useState` stores; composables are per-page instances. Cross-page state travels via URL params (cart is a `?cart=` JSON query param, see `useTicketCart`).
- Nuxt UI v4 components only (`UForm`, `UCard`, `UButton`, `UTabs`, ...). Icons as string names: `i-lucide-*`.
- Tailwind v4 CSS-first — no `tailwind.config.*`. Theme tokens and the `brand` palette live in `app/assets/css/main.css`; use the semantic classes (`text-on-surface`, `bg-surface-container`, `border-outline`).
- Forms: `UForm` + zod schema + `type FormState = z.output<typeof schema>` + `reactive<FormState>`; dates via `@internationalized/date`, converted to UTC strings before sending.
- Errors/feedback: inline `UAlert color="error" variant="subtle" icon="i-lucide-triangle-alert"` bound to an `errorMessage` ref, next to `isLoading`/`isSubmitting` refs. All error feedback stays inline.
- Success feedback: `useToast` with `color: 'success'` and `icon: 'i-lucide-circle-check'` after a mutation succeeds, called where the success lands (not inside composables). Don't use toasts for errors.
- Composables are imported explicitly; Vue/Nuxt primitives and `app/utils` helpers are auto-imported.
- SFCs: `<script setup lang="ts">` first, template second; Vue 3.5 prop destructure (`const { event } = defineProps<Props>()`).

## Payments (Midtrans Snap)

Flow: `/e/[slug]/tickets` → cart in `?cart=` → `/e/[slug]/checkout` → `POST /api/checkout/create` (re-prices lines from DB ticket types — never trust client prices) → Midtrans Snap redirect → both `GET /api/checkout/finish` (session redirect callback) and `POST /api/webhooks/midtrans` (SHA512-verified, idempotent, issues tickets on settlement) → `/checkout/finish` page. Status mapping lives in `mapMidtransStatusToOrder` in `server/services/order.service.ts`.

## Style

- Prettier: no semicolons, single quotes, 2-space indent. ESLint: no trailing commas, 1tbs braces.
- Minimal comments — only where the code can't speak for itself.
- User-visible messages: Bahasa Indonesia.
- Env vars: see `.env.example`; server secrets map to `runtimeConfig` in `nuxt.config.ts`.
