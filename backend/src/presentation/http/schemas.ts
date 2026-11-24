import { z } from 'zod'

const csvParam = z.preprocess((value) => {
  if (value == null) return undefined
  const raw = Array.isArray(value) ? value.map(String) : [String(value)]
  const parts = raw
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : undefined
}, z.array(z.string()).optional())

const booleanParam = z.preprocess((value) => {
  if (value === 'true' || value === true) return true
  if (value === 'false' || value === false) return false
  return undefined
}, z.boolean().optional())

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido (minúsculas, números y guiones)')

export const idParamSchema = z.object({ id: z.string().trim().min(1).max(60) })

export const productQuerySchema = z.object({
  categories: csvParam,
  series: csvParam,
  q: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  inStock: booleanParam,
  sort: z
    .enum([
      'default',
      'price_asc',
      'price_desc',
      'newest',
      'name_asc',
      'name_desc',
      'size_asc',
      'size_desc',
      'stock_asc',
      'stock_desc',
      'status_asc',
      'status_desc',
    ])
    .optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
})

export const productBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  categoryId: z.string().trim().min(1),
  primarySeriesId: z.string().trim().min(1),
  seriesIds: z.array(z.string().trim().min(1)).min(1).max(20),
  priceCents: z.number().int().min(1),
  imageUrl: z.string().trim().max(2000).optional(),
  details: z.string().trim().max(5000).optional(),
  stock: z.number().int().min(0).max(999999),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

export const toggleActiveSchema = z.object({ isActive: z.boolean() })
export const toggleFeaturedSchema = z.object({ isFeatured: z.boolean() })

export const categoryBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema.optional(),
  basePriceCents: z.number().int().min(0),
  sortOrder: z.number().int().min(0).max(9999).optional(),
})

export const seriesBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema.optional(),
  imageUrl: z.string().trim().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
})

export const offerBodySchema = z.object({
  categoryId: z.string().trim().min(1),
  minQuantity: z.number().int().min(1).max(9999),
  unitPriceCents: z.number().int().min(1),
  isActive: z.boolean().optional(),
})

export const orderBodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(60),
})

export const orderQuerySchema = z.object({
  status: z.enum(['PENDIENTE', 'CONFIRMADO', 'CANCELADO']).optional(),
  q: z.string().trim().max(20).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
})

export const loginBodySchema = z.object({
  email: z.email().trim(),
  password: z.string().min(1).max(200),
})
