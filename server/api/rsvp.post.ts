import { z } from 'zod'
import { serverSupabaseClient } from '#supabase/server'
import { useResend } from '../utils/resend'

const rsvpBodySchema = z.object({
  eventId: z.number(),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  email: z.email('Masukkan alamat email yang valid.'),
  organization: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => rsvpBodySchema.parse(b))
  const client = await serverSupabaseClient(event)

  const { data: eventData, error: eventError } = await client
    .from('events')
    .select('id, title, starts_at, location')
    .eq('id', body.eventId)
    .single()

  if (eventError || !eventData) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Acara tidak ditemukan',
    })
  }

  const token = crypto.randomUUID()
  const { data: rsvp, error: rsvpError } = await client
    .from('rsvps')
    .insert({
      event_id: body.eventId,
      name: body.name,
      email: body.email,
      organization: body.organization || null,
      token,
      is_attending: true,
    })
    .select('id, token')
    .single()

  if (rsvpError || !rsvp) {
    throw createError({
      statusCode: 500,
      statusMessage: rsvpError?.message || 'Gagal menyimpan RSVP',
    })
  }

  const reqUrl = getRequestURL(event)
  const ticketUrl = `${reqUrl.origin}/rsvp/${rsvp.token}`
  const resend = useResend()

  const fromAddress =
    process.env.NUXT_EMAIL_FROM || 'Bursa Kerja FPCE <test@email.munthe.dev>'
  const subject = `Konfirmasi RSVP: ${eventData.title}`

  if (!resend) {
    console.warn(
      "Resend instance doesn't exist. Confirmation email will not be sent",
    )

    await client.from('confirmation_emails').insert({
      rsvp_id: rsvp.id,
      recipient_email: body.email,
      subject,
      status: 'failed',
      error_message: "Resend instance doesn't exist",
    })

    return { success: true, token: rsvp.token }
  }

  const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
            <h2 style="color: #111827; margin-bottom: 16px;">Halo ${body.name},</h2>
            <p style="font-size: 16px; line-height: 24px; margin-bottom: 20px;">
              Terima kasih telah melakukan reservasi untuk menghadiri <strong>${eventData.title}</strong>.
            </p>
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 6px 0; font-size: 14px;"><strong>Lokasi:</strong> ${eventData.location || '-'}</p>
              <p style="margin: 6px 0; font-size: 14px;"><strong>Waktu:</strong> ${new Date(eventData.starts_at || '').toLocaleString()}</p>
            </div>
            <p style="font-size: 15px; line-height: 22px; margin-bottom: 24px;">
              Anda dapat melihat detail tiket dan status reservasi Anda kapan saja melalui tautan berikut:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${ticketUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Lihat Tiket RSVP</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
            <p style="color: #6b7280; font-size: 12px; line-height: 18px;">
              Tautan tiket langsung: <a href="${ticketUrl}" style="color: #2563eb;">${ticketUrl}</a>
            </p>
          </div>
        `

  try {
    const emailResult = await resend?.emails.send({
      from: fromAddress,
      to: [body.email],
      subject,
      html: emailHtml,
    })

    // log to confirmation_emails
    await client.from('confirmation_emails').insert({
      rsvp_id: rsvp.id,
      recipient_email: body.email,
      subject,
      status: 'sent',
      provider_message_id: emailResult?.data?.id || null,
      sent_at: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    // Log error to confirmation_emails without failing user's RSVP
    await client.from('confirmation_emails').insert({
      rsvp_id: rsvp.id,
      recipient_email: body.email,
      subject,
      status: 'failed',
      error_message: errorMsg,
    })
  }

  return { success: true, token: rsvp.token }
})
