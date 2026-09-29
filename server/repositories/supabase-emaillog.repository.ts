import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
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
}
