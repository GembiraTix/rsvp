import { useRsvpService } from '#server/utils/rsvp-service'

export default defineEventHandler(async (event) => {
  const { auth } = event.context
  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const rsvpService = await useRsvpService(event)
  const rsvps = await rsvpService.listAttendingByEmail(auth.user.email ?? '')

  return { success: true, data: rsvps }
})
