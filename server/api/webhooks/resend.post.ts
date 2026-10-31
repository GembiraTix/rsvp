import { Resend } from 'resend'
import { serverSupabaseServiceRole } from '#supabase/server'
import { SupabaseEmailLogRepository } from '#server/repositories/supabase-emaillog.repository'
import type { Database } from '~/types/database.types'

type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.bounced'
  | 'email.complained'

type DeliverabilityStatus = 'sent' | 'delivered' | 'bounced' | 'failed'

const STATUS_MAP: Record<ResendEventType, DeliverabilityStatus> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'bounced',
}

/**
 * POST /api/webhooks/resend
 *
 * Receives Resend lifecycle events and updates `confirmation_emails.status`.
 * Payload is verified using Resend's built-in Svix signature wrapper.
 * Requires RESEND_WEBHOOK_SECRET (whsec_…) from the Resend dashboard.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const webhookSecret = config.resendWebhookSecret

  if (!webhookSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Webhook secret not configured.' })
  }

  // Raw body is required — parsed JSON breaks Svix HMAC verification
  const rawBody = await readRawBody(event, 'utf-8')
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Empty body.' })
  }

  const svixId = getHeader(event, 'svix-id') ?? ''
  const svixTimestamp = getHeader(event, 'svix-timestamp') ?? ''
  const svixSignature = getHeader(event, 'svix-signature') ?? ''

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw createError({ statusCode: 400, statusMessage: 'Missing svix headers.' })
  }

  const resend = new Resend(config.resendApiKey ?? '')
  let webhookEvent: { type: string; data: Record<string, unknown> }

  try {
    webhookEvent = resend.webhooks.verify({
      payload: rawBody,
      headers: { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
      webhookSecret,
    }) as unknown as typeof webhookEvent
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid webhook signature.' })
  }

  const { type, data } = webhookEvent

  if (!(type in STATUS_MAP)) {
    // Unhandled event type (e.g. email.opened, email.clicked) — acknowledge and skip
    return { received: true }
  }

  const eventType = type as ResendEventType
  const newStatus = STATUS_MAP[eventType]
  const providerMessageId = (data.email_id as string | undefined) ?? null

  if (!providerMessageId) {
    console.warn('[resend-webhook] event missing email_id, skipping', { type })
    return { received: true }
  }

  let errorMessage: string | null = null
  let deliveredAt: string | null = null
  let metadata: Record<string, unknown> = { resend_event_type: type, resend_payload: data }

  if (eventType === 'email.delivered') {
    deliveredAt = (data.created_at as string | undefined) ?? new Date().toISOString()
  }

  if (eventType === 'email.bounced') {
    const bounce = data.bounce as Record<string, unknown> | undefined
    errorMessage = bounce
      ? `${bounce.type ?? ''}: ${bounce.subType ?? ''} — ${bounce.message ?? ''}`.trim()
      : 'bounced'
  }

  if (eventType === 'email.complained') {
    errorMessage = 'Spam complaint received'
    metadata = { ...metadata, complained: true }
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const emailLogRepo = new SupabaseEmailLogRepository(client)

  await emailLogRepo.updateDeliverability({
    providerMessageId,
    status: newStatus,
    errorMessage,
    deliveredAt,
    metadata,
  })

  console.log(`[resend-webhook] ${providerMessageId} → ${newStatus}`)
  return { received: true }
})
