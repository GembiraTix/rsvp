import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (e) => {
  // TODO: block unauthed requests that come here
  // const blocked = [
  //   '/api/events/',
  //   '/api/user/',
  // ]
  const user = await serverSupabaseUser(e)

  e.context.auth = { user: user || null }
})
