import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '~/types/database.types'
import type { IEmailLogRepository } from './interfaces'

export class SupabaseEmailLogRepository implements IEmailLogRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async log(entry: {
    rsvpId: number
    email: string
    subject: string
    status: 'sent' | 'failed'
    messageId?: string | null
    error?: string
  }): Promise<void> {
    const { error } = await this.client.from('confirmation_emails').insert({
      rsvp_id: entry.rsvpId,
      recipient_email: entry.email,
      subject: entry.subject,
      status: entry.status,
      provider_message_id: entry.messageId ?? null,
      error_message: entry.error ?? null,
      sent_at: entry.status === 'sent' ? new Date().toISOString() : null,
    })

    if (error) throw error
  }

  async updateDeliverability(entry: {
    providerMessageId: string
    status: 'sent' | 'delivered' | 'bounced' | 'failed'
    errorMessage?: string | null
    deliveredAt?: string | null
    metadata?: Record<string, unknown>
  }): Promise<void> {
    const { error } = await this.client
      .from('confirmation_emails')
      .update({
        status: entry.status,
        error_message: entry.errorMessage ?? null,
        ...(entry.deliveredAt ? { sent_at: entry.deliveredAt } : {}),
        updated_at: new Date().toISOString(),
        ...(entry.metadata ? { metadata: entry.metadata as Json } : {}),
      })
      .eq('provider_message_id', entry.providerMessageId)

    if (error) throw error
  }
}
