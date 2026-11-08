import type {
  EmailSendResult,
  IEmailProvider,
  SendEmailInput,
} from './email-provider'

export class SmtpEmailProvider implements IEmailProvider {
  constructor(
    private readonly host: string,
    private readonly port: number,
  ) {}

  async send(input: SendEmailInput): Promise<EmailSendResult> {
    // nodemailer is a devDependency only used for local dev
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: false,
    })

    const info = await transporter.sendMail({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    })

    return { success: true, messageId: info.messageId }
  }
}
