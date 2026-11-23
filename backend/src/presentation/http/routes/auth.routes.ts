import { Router } from 'express'
import type { Container } from '../container'
import { asyncHandler } from '../middlewares/async-handler'
import { loginRateLimit } from '../middlewares/rate-limit'
import { validate } from '../middlewares/validate'
import { loginBodySchema } from '../schemas'
import { validatedBody } from '../helpers'

export function createAuthRouter(deps: Container): Router {
  const router = Router()

  router.post(
    '/login',
    loginRateLimit,
    validate({ body: loginBodySchema }),
    asyncHandler(async (_req, res) => {
      const { email, password } = validatedBody<{ email: string; password: string }>(res)
      res.json(await deps.auth.execute(email, password))
    }),
  )

  return router
}
