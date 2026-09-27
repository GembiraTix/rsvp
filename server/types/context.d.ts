import { JwtPayload } from '@supabase/supabase-js'

declare module 'h3' {
  interface H3EventContext {
    auth: {
      user: JwtPayload | null
    }
  }
}

export {}
