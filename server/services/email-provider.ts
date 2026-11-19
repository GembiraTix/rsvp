export type SendEmailInput = {
  to: string
  from: string
  subject: string
  html: string
}

export type EmailSendResult =
  | { success: true; messageId: string | null }
  | { success: false; error: string }

export interface IEmailProvider {
  send(input: SendEmailInput): Promise<EmailSendResult>
}
