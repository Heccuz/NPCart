import { env } from '../../infrastructure/config/env'
import { PrismaProductRepository } from '../../infrastructure/database/prisma/prisma-product-repository'
import { PrismaCategoryRepository } from '../../infrastructure/database/prisma/prisma-category-repository'
import { PrismaSeriesRepository } from '../../infrastructure/database/prisma/prisma-series-repository'
import { PrismaOfferRepository } from '../../infrastructure/database/prisma/prisma-offer-repository'
import { PrismaOrderRepository } from '../../infrastructure/database/prisma/prisma-order-repository'
import { PrismaAdminUserRepository } from '../../infrastructure/database/prisma/prisma-admin-user-repository'
import { BcryptHasher } from '../../infrastructure/security/bcrypt-hasher'
import { JwtTokenService } from '../../infrastructure/security/jwt-token-service'
import { GoogleDriveImageUrlResolver } from '../../infrastructure/images/google-drive-image-url-resolver'
import { ProductUseCases } from '../../application/use-cases/product/product-use-cases'
import { CategoryUseCases } from '../../application/use-cases/category/category-use-cases'
import { SeriesUseCases } from '../../application/use-cases/series/series-use-cases'
import { OfferUseCases } from '../../application/use-cases/offer/offer-use-cases'
import { OrderUseCases } from '../../application/use-cases/order/order-use-cases'
import { LoginAdmin } from '../../application/use-cases/auth/login-admin'

export function buildContainer() {
  const productRepo = new PrismaProductRepository()
  const categoryRepo = new PrismaCategoryRepository()
  const seriesRepo = new PrismaSeriesRepository()
  const offerRepo = new PrismaOfferRepository()
  const orderRepo = new PrismaOrderRepository()
  const adminUserRepo = new PrismaAdminUserRepository()

  const images = new GoogleDriveImageUrlResolver()
  const tokens = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN)

  return {
    tokens,
    products: new ProductUseCases(productRepo, categoryRepo, seriesRepo, images),
    categories: new CategoryUseCases(categoryRepo),
    series: new SeriesUseCases(seriesRepo, images),
    offers: new OfferUseCases(offerRepo, categoryRepo),
    orders: new OrderUseCases(orderRepo, productRepo, offerRepo),
    auth: new LoginAdmin(adminUserRepo, new BcryptHasher(), tokens),
  }
}

export type Container = ReturnType<typeof buildContainer>
