import { z } from 'zod'
import { useRsvpService } from '../../../utils/rsvp-service'

const paramsSchema = z.object({
  token: z.uuid(),
})

export default defineEventHandler(async (event) => {
  const { token } = await getValidatedRouterParams(event, paramsSchema.parse)
  const service = await useRsvpService(event)

  await service.cancelRsvp(token)

  return { success: true }
})
