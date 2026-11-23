import type { Prisma } from '../../../generated/prisma/client'
import type {
  CategoryDto,
  OfferDto,
  OrderDto,
  ProductDto,
  SeriesDto,
} from '../../../application/dto/catalog'

export type ProductRow = Prisma.ProductGetPayload<{
  include: { category: true; primarySeries: true; series: { include: { series: true } } }
}>

export type OrderRow = Prisma.OrderGetPayload<{ include: { items: true } }>

export function toProductDto(row: ProductRow): ProductDto {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    primarySeriesId: row.primarySeriesId,
    priceCents: row.priceCents,
    imageUrl: row.imageUrl,
    details: row.details,
    stock: row.stock,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    category: { id: row.category.id, name: row.category.name, slug: row.category.slug },
    primarySeries: {
      id: row.primarySeries.id,
      name: row.primarySeries.name,
      slug: row.primarySeries.slug,
    },
    series: row.series
      .map((entry) => ({ id: entry.series.id, name: entry.series.name, slug: entry.series.slug }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es')),
  }
}

export function toCategoryDto(row: {
  id: string
  name: string
  slug: string
  basePriceCents: number
  sortOrder: number
  createdAt: Date
  deletedAt: Date | null
}): CategoryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    basePriceCents: row.basePriceCents,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
  }
}

export function toSeriesDto(row: {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  sortOrder: number
  createdAt: Date
  deletedAt: Date | null
}): SeriesDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
  }
}

export function toOfferDto(row: {
  id: string
  categoryId: string
  minQuantity: number
  unitPriceCents: number
  isActive: boolean
  createdAt: Date
  deletedAt: Date | null
  category: { id: string; name: string; slug: string }
}): OfferDto {
  return {
    id: row.id,
    categoryId: row.categoryId,
    minQuantity: row.minQuantity,
    unitPriceCents: row.unitPriceCents,
    isActive: row.isActive,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
    category: { id: row.category.id, name: row.category.name, slug: row.category.slug },
  }
}

export function toOrderDto(row: OrderRow): OrderDto {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    subtotalCents: row.subtotalCents,
    discountCents: row.discountCents,
    totalCents: row.totalCents,
    createdAt: row.createdAt,
    confirmedAt: row.confirmedAt,
    items: row.items
      .map((item) => ({
        productId: item.productId,
        name: item.name,
        categoryName: item.categoryName,
        seriesName: item.seriesName,
        unitPriceCents: item.unitPriceCents,
        qty: item.qty,
        lineTotalCents: item.lineTotalCents,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es')),
  }
}
