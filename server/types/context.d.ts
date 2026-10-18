import { JwtPayload } from '@supabase/supabase-js'
import type { UserRole } from '#server/domain/types'

declare module 'h3' {
  interface H3EventContext {
    auth: {
      user: JwtPayload | null
      role?: UserRole | null
    }
  }
}

export {}
