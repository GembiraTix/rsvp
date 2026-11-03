import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import type { TicketCategory } from '#server/domain/types'

export default defineEventHandler(async (event) => {
  const { auth } = event.context
  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const client = await serverSupabaseClient<Database>(event)

  const { data, error } = await client
    .from('ticket_categories')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal memuat kategori tiket.',
    })
  }

  return { success: true, data: (data ?? []) as TicketCategory[] }
})
