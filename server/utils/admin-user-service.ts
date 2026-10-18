import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { SupabaseUserRepository } from '#server/repositories/supabase-user.repository'
import { UserService } from '#server/services/user.service'
import { buildLogger } from '#server/services/logger.factory'

export function useAdminUserService(event: H3Event): UserService {
  const client = serverSupabaseServiceRole(event)
  const repo = new SupabaseUserRepository(client)
  const logger = buildLogger()
  return new UserService(repo, logger)
}
