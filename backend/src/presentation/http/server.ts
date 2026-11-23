import express, { Router } from 'express'
import cors from 'cors'
import { env, frontendOrigins } from '../../infrastructure/config/env'
import { buildContainer } from './container'
import { requireAdmin } from './middlewares/auth'
import { errorHandler } from './middlewares/error-handler'
import { createProductAdminRouter, createProductPublicRouter } from './routes/product.routes'
import { createCategoryAdminRouter, createCategoryPublicRouter } from './routes/category.routes'
import { createSeriesAdminRouter, createSeriesPublicRouter } from './routes/series.routes'
import { createOfferAdminRouter, createOfferPublicRouter } from './routes/offer.routes'
import { createOrderAdminRouter, createOrderPublicRouter } from './routes/order.routes'
import { createAuthRouter } from './routes/auth.routes'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')

  if (env.NODE_ENV === 'production') app.set('trust proxy', 1)

  // Catálogo con posible IP de terceros: fuera de buscadores.
  app.use((_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow')
    next()
  })
  app.use(express.json({ limit: '100kb' }))
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || frontendOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(null, false)
        }
      },
    }),
  )

  const deps = buildContainer()

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'npcart-api', uptime: process.uptime() })
  })

  app.use('/api/auth', createAuthRouter(deps))
  app.use('/api/products', createProductPublicRouter(deps))
  app.use('/api/categories', createCategoryPublicRouter(deps))
  app.use('/api/series', createSeriesPublicRouter(deps))
  app.use('/api/offers', createOfferPublicRouter(deps))
  app.use('/api/orders', createOrderPublicRouter(deps))

  const adminRouter = Router()
  adminRouter.use(requireAdmin(deps.tokens))
  adminRouter.use('/products', createProductAdminRouter(deps))
  adminRouter.use('/categories', createCategoryAdminRouter(deps))
  adminRouter.use('/series', createSeriesAdminRouter(deps))
  adminRouter.use('/offers', createOfferAdminRouter(deps))
  adminRouter.use('/orders', createOrderAdminRouter(deps))
  app.use('/api/admin', adminRouter)

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } })
  })

  app.use(errorHandler)

  return app
}

const app = createApp()
app.listen(env.PORT, () => {
  console.log(`[api] NPCart API escuchando en http://localhost:${env.PORT}`)
})
