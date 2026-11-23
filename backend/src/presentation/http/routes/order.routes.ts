import { Router } from 'express'
import type { OrderStatusDto } from '../../../application/dto/catalog'
import type { Container } from '../container'
import { asyncHandler } from '../middlewares/async-handler'
import { orderRateLimit } from '../middlewares/rate-limit'
import { validate } from '../middlewares/validate'
import { idParamSchema, orderBodySchema, orderQuerySchema } from '../schemas'
import { validatedBody, validatedParams, validatedQuery } from '../helpers'

interface OrderQuery {
  status?: OrderStatusDto
  q?: string
  from?: Date
  to?: Date
  page?: number
  pageSize?: number
}

export function createOrderPublicRouter(deps: Container): Router {
  const router = Router()

  router.post(
    '/',
    orderRateLimit,
    validate({ body: orderBodySchema }),
    asyncHandler(async (_req, res) => {
      const body = validatedBody<{ items: { productId: string; qty: number }[] }>(res)
      res.status(201).json(await deps.orders.create(body.items))
    }),
  )

  return router
}

export function createOrderAdminRouter(deps: Container): Router {
  const router = Router()

  router.get(
    '/',
    validate({ query: orderQuerySchema }),
    asyncHandler(async (_req, res) => {
      const query = validatedQuery<OrderQuery>(res)
      res.json(
        await deps.orders.listAdmin({
          status: query.status,
          q: query.q,
          from: query.from,
          to: query.to,
          page: query.page,
          pageSize: query.pageSize,
        }),
      )
    }),
  )

  router.get(
    '/:id',
    validate({ params: idParamSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      res.json(await deps.orders.getAdmin(id))
    }),
  )

  router.put(
    '/:id/confirm',
    validate({ params: idParamSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      res.json(await deps.orders.confirm(id))
    }),
  )

  router.put(
    '/:id/cancel',
    validate({ params: idParamSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      res.json(await deps.orders.cancel(id))
    }),
  )

  return router
}
