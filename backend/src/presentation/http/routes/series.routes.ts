import { Router } from 'express'
import type { Container } from '../container'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate'
import { idParamSchema, seriesBodySchema } from '../schemas'
import { validatedBody, validatedParams } from '../helpers'

type SeriesBody = Parameters<Container['series']['create']>[0]

export function createSeriesPublicRouter(deps: Container): Router {
  const router = Router()
  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json({ items: await deps.series.listPublic() })
    }),
  )
  return router
}

export function createSeriesAdminRouter(deps: Container): Router {
  const router = Router()

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json({ items: await deps.series.listAdmin() })
    }),
  )

  router.post(
    '/',
    validate({ body: seriesBodySchema }),
    asyncHandler(async (_req, res) => {
      res.status(201).json(await deps.series.create(validatedBody<SeriesBody>(res)))
    }),
  )

  router.put(
    '/:id',
    validate({ params: idParamSchema, body: seriesBodySchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      res.json(await deps.series.update(id, validatedBody<SeriesBody>(res)))
    }),
  )

  router.delete(
    '/:id',
    validate({ params: idParamSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      await deps.series.archive(id)
      res.status(204).send()
    }),
  )

  router.post(
    '/:id/restore',
    validate({ params: idParamSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      await deps.series.restore(id)
      res.status(204).send()
    }),
  )

  return router
}
