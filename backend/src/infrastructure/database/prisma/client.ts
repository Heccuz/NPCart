import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../../generated/prisma/client'

/**
 * Prisma 7: el cliente requiere un driver adapter (sin engine Rust).
 * La conexión se pasa aquí; el schema ya no define url.
 */
export function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma = createPrismaClient()
