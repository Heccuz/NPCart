import { Router } from 'express'
import type { Container } from '../container'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate'
import { idParamSchema, offerBodySchema } from '../schemas'
import { validatedBody, validatedParams } from '../helpers'

type OfferBody = Parameters<Container['offers']['create']>[0]

export function createOfferPublicRouter(deps: Container): Router {
  const router = Router()
  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json({ items: await deps.offers.listPublic() })
    }),
  )
  return router
}

export function createOfferAdminRouter(deps: Container): Router {
  const router = Router()

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json({ items: await deps.offers.listAdmin() })
    }),
  )

  router.post(
    '/',
    validate({ body: offerBodySchema }),
    asyncHandler(async (_req, res) => {
      res.status(201).json(await deps.offers.create(validatedBody<OfferBody>(res)))
    }),
  )

  router.put(
    '/:id',
    validate({ params: idParamSchema, body: offerBodySchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      res.json(await deps.offers.update(id, validatedBody<OfferBody>(res)))
    }),
  )

  router.delete(
    '/:id',
    validate({ params: idParamSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      await deps.offers.archive(id)
      res.status(204).send()
    }),
  )

  router.post(
    '/:id/restore',
    validate({ params: idParamSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      await deps.offers.restore(id)
      res.status(204).send()
    }),
  )

  return router
}
