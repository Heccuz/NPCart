import jwt, { type SignOptions } from 'jsonwebtoken'
import type { ITokenService, TokenPayload } from '../../application/ports/token-service'

export class JwtTokenService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn as SignOptions['expiresIn'],
    })
  }

  verify(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret)
      if (
        typeof decoded === 'object' &&
        decoded !== null &&
        typeof decoded.sub === 'string' &&
        typeof (decoded as Record<string, unknown>).email === 'string'
      ) {
        return { sub: decoded.sub, email: (decoded as Record<string, unknown>).email as string }
      }
      return null
    } catch {
      return null
    }
  }
}
