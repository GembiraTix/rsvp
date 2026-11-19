import type { EmailSendResult, IEmailProvider, SendEmailInput } from './email-provider'

export class EmailService {
  constructor(
    private readonly provider: IEmailProvider,
    private readonly from: string,
  ) {}

  async send(input: Omit<SendEmailInput, 'from'>): Promise<EmailSendResult> {
    try {
      return await this.provider.send({ ...input, from: this.from })
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err)
      return { success: false, error }
    }
  }
}
