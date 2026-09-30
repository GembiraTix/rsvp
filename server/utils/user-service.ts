import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { SupabaseUserRepository } from '#server/repositories/supabase-user.repository'
import { UserService } from '#server/services/user.service'
import { buildLogger } from '#server/services/logger.factory'

export async function useUserService(event: H3Event): Promise<UserService> {
  const client = await serverSupabaseClient(event)
  const repo = new SupabaseUserRepository(client)
  const logger = buildLogger()
  return new UserService(repo, logger)
}
