import { EmailService } from '#server/services/email.service'
import { ResendEmailProvider } from '#server/services/resend-email.provider'
import { SmtpEmailProvider } from '#server/services/smtp-email.provider'

export function useEmailService(): EmailService | null {
  const config = useRuntimeConfig()

  if (config.emailProvider === 'smtp') {
    return new EmailService(new SmtpEmailProvider(config.smtpHost, config.smtpPort))
  }

  if (!config.resendApiKey) {
    return null
  }
  return new EmailService(new ResendEmailProvider(config.resendApiKey))
}
