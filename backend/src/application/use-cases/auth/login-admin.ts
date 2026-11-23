import type { IAdminUserRepository } from '../../../domain/repositories/admin-user-repository'
import type { IPasswordHasher } from '../../ports/password-hasher'
import type { ITokenService } from '../../ports/token-service'
import { unauthorized } from '../../errors/app-error'

export interface LoginResult {
  token: string
  email: string
}

export class LoginAdmin {
  constructor(
    private readonly users: IAdminUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email.trim().toLowerCase())
    if (!user) throw unauthorized()

    const passwordMatches = await this.hasher.compare(password, user.passwordHash)
    if (!passwordMatches) throw unauthorized()

    return {
      token: this.tokens.sign({ sub: user.id, email: user.email }),
      email: user.email,
    }
  }
}
