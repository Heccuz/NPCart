import type { IAdminUserRepository } from '../../../domain/repositories/admin-user-repository'
import { prisma } from './client'

export class PrismaAdminUserRepository implements IAdminUserRepository {
  async findByEmail(email: string) {
    const row = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } })
    return row
      ? { id: row.id, email: row.email, passwordHash: row.passwordHash }
      : null
  }

  async upsert(email: string, passwordHash: string) {
    const row = await prisma.adminUser.upsert({
      where: { email: email.toLowerCase() },
      update: { passwordHash },
      create: { email: email.toLowerCase(), passwordHash },
    })
    return { id: row.id, email: row.email, passwordHash: row.passwordHash }
  }
}
