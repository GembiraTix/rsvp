import { Resend } from 'resend'
import type { EmailSendResult, IEmailProvider, SendEmailInput } from './email-provider'

export class ResendEmailProvider implements IEmailProvider {
  private readonly resend: Resend

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey)
  }

  async send(input: SendEmailInput): Promise<EmailSendResult> {
    // the SDK resolves with { data, error } instead of throwing on API failure
    const result = await this.resend.emails.send({
      from: input.from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    })

    if (result.error) {
      return { success: false, error: result.error.message }
    }
    return { success: true, messageId: result.data?.id ?? null }
  }
}
