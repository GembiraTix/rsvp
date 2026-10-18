import { serverSupabaseUser } from '#supabase/server'
import type { UserRole } from '#server/domain/types'

export default defineEventHandler(async (e) => {
  const user = await serverSupabaseUser(e)

  const role = (user?.app_metadata?.role ||
    user?.user_metadata?.role ||
    'user') as UserRole

  e.context.auth = {
    user: user || null,
    role: user ? role : null,
  }
})
