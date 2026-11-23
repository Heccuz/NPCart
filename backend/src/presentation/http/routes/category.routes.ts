import { Router } from 'express'
import type { Container } from '../container'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate'
import { categoryBodySchema, idParamSchema } from '../schemas'
import { validatedBody, validatedParams } from '../helpers'

type CategoryBody = Parameters<Container['categories']['create']>[0]

export function createCategoryPublicRouter(deps: Container): Router {
  const router = Router()
  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json({ items: await deps.categories.listPublic() })
    }),
  )
  return router
}

export function createCategoryAdminRouter(deps: Container): Router {
  const router = Router()

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json({ items: await deps.categories.listAdmin() })
    }),
  )

  router.post(
    '/',
    validate({ body: categoryBodySchema }),
    asyncHandler(async (_req, res) => {
      const body = validatedBody<CategoryBody>(res)
      res.status(201).json(await deps.categories.create(body))
    }),
  )

  router.put(
    '/:id',
    validate({ params: idParamSchema, body: categoryBodySchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      res.json(await deps.categories.update(id, validatedBody<CategoryBody>(res)))
    }),
  )

  router.delete(
    '/:id',
    validate({ params: idParamSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      await deps.categories.archive(id)
      res.status(204).send()
    }),
  )

  router.post(
    '/:id/restore',
    validate({ params: idParamSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      await deps.categories.restore(id)
      res.status(204).send()
    }),
  )

  return router
}
