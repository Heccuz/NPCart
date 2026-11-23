import { Router } from 'express'
import type { ProductListFilters, ProductSort } from '../../../application/dto/catalog'
import type { Container } from '../container'
import { asyncHandler } from '../middlewares/async-handler'
import { validate } from '../middlewares/validate'
import { idParamSchema, productBodySchema, productQuerySchema, toggleActiveSchema, toggleFeaturedSchema } from '../schemas'
import { validatedBody, validatedParams, validatedQuery } from '../helpers'

interface ProductQuery {
  categories?: string[]
  series?: string[]
  q?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sort?: ProductSort
  page?: number
  pageSize?: number
}

function toFilters(query: ProductQuery): ProductListFilters {
  return {
    categorySlugs: query.categories,
    seriesSlugs: query.series,
    q: query.q,
    minPriceCents: query.minPrice,
    maxPriceCents: query.maxPrice,
    inStock: query.inStock,
    sort: query.sort,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export function createProductPublicRouter(deps: Container): Router {
  const router = Router()

  // Declarada antes de /:id — Express confundiría "featured" con un id.
  router.get(
    '/featured',
    asyncHandler(async (_req, res) => {
      res.json({ items: await deps.products.featured(8) })
    }),
  )

  router.get(
    '/',
    validate({ query: productQuerySchema }),
    asyncHandler(async (_req, res) => {
      const query = validatedQuery<ProductQuery>(res)
      res.json(await deps.products.listPublic(toFilters(query)))
    }),
  )

  router.get(
    '/:id',
    validate({ params: idParamSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      res.json(await deps.products.getPublic(id))
    }),
  )

  return router
}

export function createProductAdminRouter(deps: Container): Router {
  const router = Router()

  router.get(
    '/',
    validate({ query: productQuerySchema }),
    asyncHandler(async (_req, res) => {
      const query = validatedQuery<ProductQuery>(res)
      res.json(await deps.products.listAdmin(toFilters(query)))
    }),
  )

  router.get(
    '/:id',
    validate({ params: idParamSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      res.json(await deps.products.getAdmin(id))
    }),
  )

  router.post(
    '/',
    validate({ body: productBodySchema }),
    asyncHandler(async (_req, res) => {
      const body = validatedBody<Parameters<Container['products']['create']>[0]>(res)
      res.status(201).json(await deps.products.create(body))
    }),
  )

  router.put(
    '/:id',
    validate({ params: idParamSchema, body: productBodySchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      const body = validatedBody<Parameters<Container['products']['create']>[0]>(res)
      res.json(await deps.products.update(id, body))
    }),
  )

  router.delete(
    '/:id',
    validate({ params: idParamSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      await deps.products.archive(id)
      res.status(204).send()
    }),
  )

  router.post(
    '/:id/restore',
    validate({ params: idParamSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      await deps.products.restore(id)
      res.status(204).send()
    }),
  )

  router.patch(
    '/:id/active',
    validate({ params: idParamSchema, body: toggleActiveSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      const { isActive } = validatedBody<{ isActive: boolean }>(res)
      res.json(await deps.products.toggleActive(id, isActive))
    }),
  )

  router.patch(
    '/:id/featured',
    validate({ params: idParamSchema, body: toggleFeaturedSchema }),
    asyncHandler(async (_req, res) => {
      const { id } = validatedParams<{ id: string }>(res)
      const { isFeatured } = validatedBody<{ isFeatured: boolean }>(res)
      res.json(await deps.products.toggleFeatured(id, isFeatured))
    }),
  )

  return router
}
