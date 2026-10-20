import type {
  IRsvpRepository,
  IEventRepository,
  IEmailLogRepository,
} from '#server/repositories/interfaces'
import type { Rsvp } from '#server/domain/types'
import type { ILogger } from './logger.service'
import { useResend } from '#server/utils/resend'

export class RsvpService {
  constructor(
    private readonly rsvpRepo: IRsvpRepository,
    private readonly eventRepo: IEventRepository,
    private readonly emailLogRepo: IEmailLogRepository,
    private readonly logger: ILogger,
  ) {}

  async createRsvp(input: {
    eventId: number
    name: string
    email: string
    organization?: string
    origin: string
  }): Promise<Rsvp> {
    this.logger.info('Creating RSVP', {
      eventId: input.eventId,
      email: input.email,
    })

    const event = await this.eventRepo.findById(input.eventId)
    if (!event) {
      throw new Error('Acara tidak ditemukan')
    }

    const token = crypto.randomUUID()
    const rsvp = await this.rsvpRepo.create({
      event_id: input.eventId,
      name: input.name,
      email: input.email,
      organization: input.organization ?? null,
      token,
      is_attending: true,
    })

    const ticketUrl = `${input.origin}/rsvp/${rsvp.token}`
    const subject = `Konfirmasi RSVP: ${event.title}`
    const resend = useResend()

    if (!resend) {
      this.logger.warn('Resend not configured, skipping confirmation email', {
        rsvpId: rsvp.id,
      })
      await this.emailLogRepo.log({
        rsvpId: rsvp.id,
        email: input.email,
        subject,
        status: 'failed',
        error: "Resend instance doesn't exist",
      })
      return rsvp
    }

    const emailHtml = buildEmailHtml({
      name: input.name,
      eventTitle: event.title ?? '',
      eventLocation: event.location,
      eventStartsAt: event.starts_at,
      ticketUrl,
    })

    try {
      const from = useRuntimeConfig().emailFrom
      const fromFallback = 'GembiraTix <noreply@info.gembiratix.my.id>'
      if (!from) {
        this.logger.warn(
          `email: sender email address is not defined falling back to ${fromFallback}`,
        )
      }

      const result = await resend.emails.send({
        from: from || fromFallback,
        to: [input.email],
        subject,
        html: emailHtml,
      })

      await this.emailLogRepo.log({
        rsvpId: rsvp.id,
        email: input.email,
        subject,
        status: 'sent',
        messageId: result.data?.id ?? null,
      })

      this.logger.info('Confirmation email sent', {
        rsvpId: rsvp.id,
        messageId: result.data?.id,
      })
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      this.logger.error('Failed to send confirmation email', {
        rsvpId: rsvp.id,
        error: errorMsg,
      })

      await this.emailLogRepo.log({
        rsvpId: rsvp.id,
        email: input.email,
        subject,
        status: 'failed',
        error: errorMsg,
      })
    }

    this.logger.info('RSVP created successfully', { rsvpId: rsvp.id })
    return rsvp
  }

  async getRsvpByToken(token: string): Promise<Rsvp | null> {
    this.logger.info('Fetching RSVP by token', { token })
    return this.rsvpRepo.findByToken(token)
  }

  async listRsvpsByEvent(eventId: number): Promise<Rsvp[]> {
    this.logger.info('Listing RSVPs for event', { eventId })
    return this.rsvpRepo.findByEventId(eventId)
  }

  async getRsvpByEventAndEmail(
    eventId: number,
    email: string,
  ): Promise<Rsvp | null> {
    this.logger.info('Checking existing RSVP', { eventId, email })
    return this.rsvpRepo.findByEventAndEmail(eventId, email)
  }
}

function buildEmailHtml(input: {
  name: string
  eventTitle: string
  eventLocation: string | null
  eventStartsAt: string | null
  ticketUrl: string
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="color: #111827; margin-bottom: 16px;">Halo ${input.name},</h2>
      <p style="font-size: 16px; line-height: 24px; margin-bottom: 20px;">
        Terima kasih telah melakukan reservasi untuk menghadiri <strong>${input.eventTitle}</strong>.
      </p>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 6px 0; font-size: 14px;"><strong>Lokasi:</strong> ${input.eventLocation || '-'}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Waktu:</strong> ${new Date(input.eventStartsAt || '').toLocaleString()}</p>
      </div>
      <p style="font-size: 15px; line-height: 22px; margin-bottom: 24px;">
        Anda dapat melihat detail tiket dan status reservasi Anda kapan saja melalui tautan berikut:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${input.ticketUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Lihat Tiket RSVP</a>
      </div>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
      <p style="color: #6b7280; font-size: 12px; line-height: 18px;">
        Tautan tiket langsung: <a href="${input.ticketUrl}" style="color: #2563eb;">${input.ticketUrl}</a>
      </p>
    </div>
  `
}
