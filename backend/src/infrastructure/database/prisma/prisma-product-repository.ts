import type { Prisma } from '@prisma/client'
import type {
  FacetCounts,
  PaginatedProducts,
  ProductListFilters,
  ProductSort,
} from '../../../application/dto/catalog'
import type { IProductRepository } from '../../../domain/repositories/product-repository'
import { prisma } from './client'
import { toProductDto, type ProductRow } from './mappers'

const productInclude = {
  category: true,
  primarySeries: true,
  series: { include: { series: true } },
} as const

function buildWhere(
  filters: ProductListFilters,
  opts: { skipCategories?: boolean; skipSeries?: boolean } = {},
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    ...(filters.includeArchived ? {} : { deletedAt: null }),
    ...(filters.includeInactive ? {} : { isActive: true }),
  }

  if (!opts.skipCategories && filters.categorySlugs?.length) {
    where.category = { slug: { in: filters.categorySlugs }, deletedAt: null }
  }

  if (!opts.skipSeries && filters.seriesSlugs?.length) {
    where.series = { some: { series: { slug: { in: filters.seriesSlugs }, deletedAt: null } } }
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim()
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { details: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (filters.minPriceCents != null || filters.maxPriceCents != null) {
    where.priceCents = {
      ...(filters.minPriceCents != null ? { gte: filters.minPriceCents } : {}),
      ...(filters.maxPriceCents != null ? { lte: filters.maxPriceCents } : {}),
    }
  }

  if (filters.inStock) {
    where.stock = { gt: 0 }
  }

  return where
}

function sortRows(rows: ProductRow[], sort: ProductSort = 'default'): ProductRow[] {
  const copy = [...rows]
  switch (sort) {
    case 'price_asc':
      copy.sort((a, b) => a.priceCents - b.priceCents)
      break
    case 'price_desc':
      copy.sort((a, b) => b.priceCents - a.priceCents)
      break
    case 'newest':
      copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      break
    default:
      copy.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1
        const aSoldOut = a.stock === 0
        const bSoldOut = b.stock === 0
        if (aSoldOut !== bSoldOut) return aSoldOut ? 1 : -1
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
  }
  return copy
}

export class PrismaProductRepository implements IProductRepository {
  async list(filters: ProductListFilters): Promise<PaginatedProducts> {
    const page = Math.max(1, Math.trunc(filters.page ?? 1))
    const pageSize = Math.min(50, Math.max(1, Math.trunc(filters.pageSize ?? 12)))

    const rows = await prisma.product.findMany({
      where: buildWhere(filters),
      include: productInclude,
    })

    const sorted = sortRows(rows, filters.sort)
    const items = sorted.slice((page - 1) * pageSize, page * pageSize).map(toProductDto)

    let facets: FacetCounts | null = null
    if (filters.withFacets) {
      const [categoryRows, seriesRows] = await Promise.all([
        prisma.product.findMany({
          where: buildWhere(filters, { skipCategories: true }),
          select: { category: { select: { slug: true } } },
        }),
        prisma.product.findMany({
          where: buildWhere(filters, { skipSeries: true }),
          select: { series: { select: { series: { select: { slug: true } } } } },
        }),
      ])

      const categories: Record<string, number> = {}
      for (const row of categoryRows) {
        categories[row.category.slug] = (categories[row.category.slug] ?? 0) + 1
      }

      const series: Record<string, number> = {}
      for (const row of seriesRows) {
        const slugs = new Set(row.series.map((entry) => entry.series.slug))
        for (const slug of slugs) series[slug] = (series[slug] ?? 0) + 1
      }

      facets = { categories, series }
    }

    return { items, total: rows.length, facets }
  }

  async findById(id: string) {
    const row = await prisma.product.findUnique({ where: { id }, include: productInclude })
    return row ? toProductDto(row) : null
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) return []
    const rows = await prisma.product.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: productInclude,
    })
    return rows.map(toProductDto)
  }

  async findFeatured(limit: number) {
    const rows = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true, deletedAt: null },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: Math.min(24, Math.max(1, limit)),
    })
    return rows.map(toProductDto)
  }

  async create(data: Parameters<IProductRepository['create']>[0]) {
    const { seriesIds, ...rest } = data
    const row = await prisma.product.create({
      data: {
        ...rest,
        series: { create: seriesIds.map((seriesId) => ({ seriesId })) },
      },
      include: productInclude,
    })
    return toProductDto(row)
  }

  async update(id: string, data: Parameters<IProductRepository['update']>[1]) {
    const { seriesIds, ...rest } = data
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: rest })
      await tx.productSeries.deleteMany({ where: { productId: id } })
      await tx.productSeries.createMany({
        data: seriesIds.map((seriesId) => ({ productId: id, seriesId })),
      })
    })
    const row = await prisma.product.findUnique({ where: { id }, include: productInclude })
    if (!row) throw new Error('Producto no encontrado tras actualizar')
    return toProductDto(row)
  }

  async archive(id: string) {
    await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } })
  }

  async restore(id: string) {
    await prisma.product.update({ where: { id }, data: { deletedAt: null } })
  }

  async setActive(id: string, isActive: boolean) {
    const row = await prisma.product.update({
      where: { id },
      data: { isActive },
      include: productInclude,
    })
    return toProductDto(row)
  }

  async setFeatured(id: string, isFeatured: boolean) {
    const row = await prisma.product.update({
      where: { id },
      data: { isFeatured },
      include: productInclude,
    })
    return toProductDto(row)
  }

  async countActiveByCategory(categoryId: string) {
    return prisma.product.count({
      where: { categoryId, isActive: true, deletedAt: null },
    })
  }

  async countActiveByPrimarySeries(seriesId: string) {
    return prisma.product.count({
      where: { primarySeriesId: seriesId, isActive: true, deletedAt: null },
    })
  }
}
