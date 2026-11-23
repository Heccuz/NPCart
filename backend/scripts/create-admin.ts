import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { createPrismaClient } from '../src/infrastructure/database/prisma/client'

/**
 * Crea o resetea el admin desde ADMIN_EMAIL / ADMIN_PASSWORD.
 * Uso local: `npm run create-admin -w backend`
 * Contra prod (Railway): `railway run npm run create-admin -w backend`
 */
async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD ?? ''

  if (!email || !password) {
    throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD antes de ejecutar create-admin')
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres')
  }

  const prisma = createPrismaClient()
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    })
    console.log(`[create-admin] Admin asegurado: ${user.email}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('[create-admin] Error:', error)
  process.exitCode = 1
})
