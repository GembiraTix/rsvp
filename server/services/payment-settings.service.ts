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
  ): Promise<{ fee: number; source: AdminFeeSource }> {
    const event = await this.eventRepo.findById(eventId)
    if (!event) {
      throw createError({ statusCode: 404, statusMessage: 'Acara tidak ditemukan.' })
    }

    const settings = await this.settingsRepo.getEventPaymentSettings(eventId)
    if (settings?.admin_fee_fixed != null) {
      return { fee: settings.admin_fee_fixed, source: 'event' }
    }
    return { fee: await this.settingsRepo.getAdminFee(), source: 'global' }
  }
}
