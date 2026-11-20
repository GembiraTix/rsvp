import type { IEmailLogRepository } from '#server/repositories/interfaces'
import type { Event, Order, TicketWithTypeName } from '#server/domain/types'
import type { EmailService } from './email.service'
import type { ILogger } from './logger.service'

// One e-ticket email per settled order, addressed to the orderer form's
// email (not the account email). Legacy orders without orderer_email and
// provider failures only warn — the e-mail is additive and must never
// fail settlement.
export class OrderEmailService {
  constructor(
    private readonly emailService: EmailService | null,
    private readonly emailLogRepo: IEmailLogRepository,
    private readonly appUrl: string,
    private readonly logger: ILogger,
  ) {}

  async sendETicketEmail(input: {
    order: Order
    event: Event
    tickets: TicketWithTypeName[]
  }): Promise<void> {
    if (!input.order.orderer_email) {
      this.logger.warn('Order has no orderer email, skipping e-ticket email', {
        orderId: input.order.id,
      })
      return
    }

    if (!this.emailService) {
      this.logger.warn(
        'Email service not configured, skipping e-ticket email',
        { orderId: input.order.id },
      )
      return
    }

    const to = input.order.orderer_email
    const subject = `E-Tiket ${input.event.title ?? ''} - ${input.order.order_number}`
    const html = buildETicketEmailHtml({
      ordererName: input.order.orderer_name ?? '',
      eventTitle: input.event.title ?? '',
      eventLocation: input.event.location,
      eventStartsAt: input.event.starts_at,
      orderNumber: input.order.order_number,
      tickets: input.tickets,
      orderUrl: `${this.appUrl}/users/orders/${input.order.id}`,
    })

    const result = await this.emailService.send({ to, subject, html })

    if (result.success) {
      await this.emailLogRepo.log({
        orderId: input.order.id,
        email: to,
        subject,
        status: 'sent',
        messageId: result.messageId,
      })
      this.logger.info('E-ticket email sent', {
        orderId: input.order.id,
        messageId: result.messageId,
      })
      return
    }

    this.logger.error('Failed to send e-ticket email', {
      orderId: input.order.id,
      error: result.error,
    })
    await this.emailLogRepo.log({
      orderId: input.order.id,
      email: to,
      subject,
      status: 'failed',
      error: result.error,
    })
  }
}

function buildETicketEmailHtml(input: {
  ordererName: string
  eventTitle: string
  eventLocation: string | null
  eventStartsAt: string | null
  orderNumber: string
  tickets: TicketWithTypeName[]
  orderUrl: string
}): string {
  const ticketRows = input.tickets
    .map(
      (ticket) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px;">
            <strong>${ticket.attendee_name}</strong>
            <br />
            <span style="color: #6b7280; font-size: 13px;">${ticket.ticket_type_name ?? 'Tiket'} - ${ticket.attendee_email}</span>
          </td>
        </tr>
      `,
    )
    .join('')

  const eventTime = input.eventStartsAt
    ? new Date(input.eventStartsAt).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
      })
    : '-'

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="color: #111827; margin-bottom: 16px;">Halo ${input.ordererName},</h2>
      <p style="font-size: 16px; line-height: 24px; margin-bottom: 20px;">
        Pembayaran untuk pesanan <strong>${input.orderNumber}</strong> telah kami terima. Berikut adalah e-tiket Anda untuk menghadiri <strong>${input.eventTitle}</strong>.
      </p>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 6px 0; font-size: 14px;"><strong>Lokasi:</strong> ${input.eventLocation || '-'}</p>
        <p style="margin: 6px 0 12px; font-size: 14px;"><strong>Waktu:</strong> ${eventTime}</p>
        <table style="width: 100%; border-collapse: collapse;">${ticketRows}</table>
      </div>
      <p style="font-size: 15px; line-height: 22px; margin-bottom: 24px;">
        Tunjukkan e-tiket saat memasuki venue. Anda juga dapat melihat semua tiket Anda melalui tautan berikut:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${input.orderUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Lihat Tiket Saya</a>
      </div>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
      <p style="color: #6b7280; font-size: 12px; line-height: 18px;">
        Tautan tiket langsung: <a href="${input.orderUrl}" style="color: #2563eb;">${input.orderUrl}</a>
      </p>
    </div>
  `
}
