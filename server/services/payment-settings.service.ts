import type { ISettingsRepository } from '../repositories/interfaces'

export class PaymentSettingsService {
  constructor(private readonly settingsRepo: ISettingsRepository) {}

  async getGlobalAdminFee(): Promise<number> {
    return this.settingsRepo.getAdminFee()
  }

  async setGlobalAdminFee(adminFee: number): Promise<void> {
    await this.settingsRepo.updateAdminFee(adminFee)
  }

  async resolveAdminFee(eventId: number, subtotal: number): Promise<number> {
    const settings = await this.settingsRepo.getEventPaymentSettings(eventId)
    if (!settings || settings.admin_fee_mode === 'auto') {
      return this.settingsRepo.getAdminFee()
    }
    if (settings.admin_fee_mode === 'percent') {
      return Math.ceil((subtotal * Number(settings.admin_fee_percent)) / 100)
    }
    return settings.admin_fee_fixed
  }
}
