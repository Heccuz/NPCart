import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  JWT_SECRET: z.string().min(16).default('dev-only-secret-change-me-now'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  ADMIN_EMAIL: z.string().email().default('admin@npcart.local'),
  ADMIN_PASSWORD: z.string().min(8).default('cambia-esta-clave-ahora'),
  FRONTEND_ORIGINS: z.string().default('http://localhost:5173'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('[env] Configuración inválida:', parsed.error.flatten().fieldErrors)
  throw new Error('Variables de entorno inválidas')
}

export const env = parsed.data

export const frontendOrigins = env.FRONTEND_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev-only-secret-change-me-now') {
  throw new Error('[env] JWT_SECRET debe configurarse en producción')
}
