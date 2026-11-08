import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { ISettingsRepository } from './interfaces'

export class SupabaseSettingsRepository implements ISettingsRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getAdminFee(): Promise<number> {
    const { data, error } = await this.client
      .from('app_settings')
      .select('admin_fee')
      .eq('id', 1)
      .single()
    if (error) throw error
    return data.admin_fee
  }

  async updateAdminFee(adminFee: number): Promise<void> {
    const { error } = await this.client
      .from('app_settings')
      .update({ admin_fee: adminFee, updated_at: new Date().toISOString() })
      .eq('id', 1)
    if (error) throw error
  }

  async getEventPaymentSettings(eventId: number): Promise<{
    admin_fee_mode: string
    admin_fee_fixed: number
    admin_fee_percent: number
  } | null> {
    const { data, error } = await this.client
      .from('event_payment_settings')
      .select('admin_fee_mode, admin_fee_fixed, admin_fee_percent')
      .eq('event_id', eventId)
      .maybeSingle()
    if (error) throw error
    return data
  }
}
