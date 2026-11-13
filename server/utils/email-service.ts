import { buildLogger } from '#server/services/logger.factory'
import { EmailService } from '#server/services/email.service'
import { ResendEmailProvider } from '#server/services/resend-email.provider'
import { SmtpEmailProvider } from '#server/services/smtp-email.provider'

const fromFallback = 'GembiraTix <noreply@info.gembiratix.my.id>'

export function useEmailService(): EmailService | null {
  const config = useRuntimeConfig()
  const logger = buildLogger()

  let from = config.emailFrom
  if (!from) {
    logger.warn(`email: sender address not configured, falling back to ${fromFallback}`)
    from = fromFallback
  }

  if (config.emailProvider === 'smtp') {
    logger.warn('email: SMTP provider is intended for local development only')
    return new EmailService(new SmtpEmailProvider(config.smtpHost, config.smtpPort), from)
  }

  if (!config.resendApiKey) {
    return null
  }
  return new EmailService(new ResendEmailProvider(config.resendApiKey), from)
}
