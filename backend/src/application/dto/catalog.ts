/** DTOs de catálogo y pedidos — céntimos enteros en todo el contrato. */

export interface RefDto {
  id: string
  name: string
  slug: string
}

export interface CategoryDto {
  id: string
  name: string
  slug: string
  basePriceCents: number
  sortOrder: number
  createdAt: Date
  deletedAt: Date | null
}

export interface SeriesDto {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  sortOrder: number
  createdAt: Date
  deletedAt: Date | null
}

export interface ProductDto {
  id: string
  name: string
  categoryId: string
  primarySeriesId: string
  priceCents: number
  imageUrl: string
  details: string
  stock: number
  isActive: boolean
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  category: RefDto
  primarySeries: RefDto
  series: RefDto[]
}

export type ProductSort = 'default' | 'price_asc' | 'price_desc' | 'newest'

export interface ProductListFilters {
  categorySlugs?: string[]
  seriesSlugs?: string[]
  q?: string
  minPriceCents?: number
  maxPriceCents?: number
  inStock?: boolean
  sort?: ProductSort
  page?: number
  pageSize?: number
  includeInactive?: boolean
  includeArchived?: boolean
  withFacets?: boolean
}

export interface FacetCounts {
  categories: Record<string, number>
  series: Record<string, number>
}

export interface PaginatedProducts {
  items: ProductDto[]
  total: number
  facets: FacetCounts | null
}

export interface OfferDto {
  id: string
  categoryId: string
  minQuantity: number
  unitPriceCents: number
  isActive: boolean
  createdAt: Date
  deletedAt: Date | null
  category: RefDto
}

export type OrderStatusDto = 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO'

export interface OrderItemDto {
  productId: string
  name: string
  categoryName: string
  seriesName: string
  unitPriceCents: number
  qty: number
  lineTotalCents: number
}

export interface OrderDto {
  id: string
  code: string
  status: OrderStatusDto
  subtotalCents: number
  discountCents: number
  totalCents: number
  createdAt: Date
  confirmedAt: Date | null
  items: OrderItemDto[]
}

export interface OrderListFilters {
  status?: OrderStatusDto
  q?: string
  from?: Date
  to?: Date
  page?: number
  pageSize?: number
}

export interface PaginatedOrders {
  items: OrderDto[]
  total: number
}

export interface CreateOrderData {
  code: string
  subtotalCents: number
  discountCents: number
  totalCents: number
  items: OrderItemDto[]
}

export interface StockWarning {
  productId: string
  name: string
  requested: number
  available: number
}
