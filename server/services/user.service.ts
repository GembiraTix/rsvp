import type { IUserRepository } from '#server/repositories/interfaces'
import type { UserProfile, UpdateUserProfileInput } from '#server/domain/types'
import type { ILogger } from './logger.service'

export class UserService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly logger: ILogger,
  ) {}

  async getProfile(userId: string): Promise<UserProfile | null> {
    this.logger.info('Fetching user profile', { userId })
    let profile = await this.userRepo.findById(userId)

    return profile
  }

  async updateProfile(
    userId: string,
    input: UpdateUserProfileInput,
  ): Promise<UserProfile> {
    this.logger.info('Updating user profile', { userId, input })
    const profile = await this.userRepo.update(userId, input)
    return profile
  }
}
