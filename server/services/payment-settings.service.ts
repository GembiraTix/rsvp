import type { IEventRepository, ISettingsRepository } from '../repositories/interfaces'

export type AdminFeeSource = 'global' | 'event'

export class PaymentSettingsService {
  constructor(
    private readonly settingsRepo: ISettingsRepository,
    private readonly eventRepo: IEventRepository,
  ) {}

  async getGlobalAdminFee(): Promise<number> {
    return this.settingsRepo.getAdminFee()
  }

  async setGlobalAdminFee(adminFee: number): Promise<void> {
    await this.settingsRepo.updateAdminFee(adminFee)
  }

  async resolveAdminFee(
    eventId: number,
    subtotal: number,
  ): Promise<{ fee: number; source: AdminFeeSource }> {
    const event = await this.eventRepo.findById(eventId)
    if (!event) {
      throw createError({ statusCode: 404, statusMessage: 'Acara tidak ditemukan.' })
    }

    const settings = await this.settingsRepo.getEventPaymentSettings(eventId)
    if (!settings || settings.admin_fee_mode === 'auto') {
      return { fee: await this.settingsRepo.getAdminFee(), source: 'global' }
    }
    if (settings.admin_fee_mode === 'percent') {
      return {
        fee: Math.ceil((subtotal * Number(settings.admin_fee_percent)) / 100),
        source: 'event',
      }
    }
    return { fee: settings.admin_fee_fixed, source: 'event' }
  }
}
