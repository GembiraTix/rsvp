import { serverSupabaseClient } from '#supabase/server'

export default eventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const { data: supabaseData, error } = await supabase.from('test').select('*')

  return supabaseData
})
