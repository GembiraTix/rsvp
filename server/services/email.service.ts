import type { EmailSendResult, IEmailProvider, SendEmailInput } from './email-provider'

export class EmailService {
  constructor(private readonly provider: IEmailProvider) {}

  async send(input: Omit<SendEmailInput, 'from'>): Promise<EmailSendResult> {
    try {
      return await this.provider.send({ ...input, from: this.resolveFrom() })
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err)
      return { success: false, error }
    }
  }

  private resolveFrom(): string {
    const config = useRuntimeConfig()
    const fromFallback = 'GembiraTix <noreply@info.gembiratix.my.id>'
    return config.emailFrom || fromFallback
  }
}
