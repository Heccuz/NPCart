import bcrypt from 'bcryptjs'
import type { IPasswordHasher } from '../../application/ports/password-hasher'

export class BcryptHasher implements IPasswordHasher {
  async hash(plain: string) {
    return bcrypt.hash(plain, 10)
  }

  async compare(plain: string, hash: string) {
    return bcrypt.compare(plain, hash)
  }
}
