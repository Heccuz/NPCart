export interface Ref {
  id: string
  name: string
  slug: string
}

export interface Category {
  id: string
  name: string
  slug: string
  basePriceCents: number
  sortOrder: number
  createdAt: string
  deletedAt: string | null
}

export interface Series {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  sortOrder: number
  createdAt: string
  deletedAt: string | null
}

export interface Product {
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
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  category: Ref
  primarySeries: Ref
  series: Ref[]
}

export interface CategoryOffer {
  id: string
  categoryId: string
  minQuantity: number
  unitPriceCents: number
  isActive: boolean
  createdAt: string
  deletedAt: string | null
  category: Ref
}

export type ProductSort = 'default' | 'price_asc' | 'price_desc' | 'newest'

export interface FacetCounts {
  categories: Record<string, number>
  series: Record<string, number>
}

export interface ProductListResponse {
  items: Product[]
  total: number
  facets: FacetCounts | null
}

export interface CartItem {
  productId: string
  name: string
  categoryId: string
  categoryName: string
  seriesName: string
  priceCents: number
  imageUrl: string
  stock: number
  qty: number
}

export interface OrderItem {
  productId: string
  name: string
  categoryName: string
  seriesName: string
  unitPriceCents: number
  qty: number
  lineTotalCents: number
}

export type OrderStatus = 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO'

export interface Order {
  id: string
  code: string
  status: OrderStatus
  subtotalCents: number
  discountCents: number
  totalCents: number
  createdAt: string
  confirmedAt: string | null
  items: OrderItem[]
}

export interface ExcludedOrderItem {
  productId: string
  name: string
  reason: 'AGOTADO' | 'NO_DISPONIBLE'
  requestedQty: number
}

export interface AdjustedOrderItem {
  productId: string
  name: string
  requestedQty: number
  availableQty: number
}

export interface CreateOrderResponse {
  order: Order
  excluded: ExcludedOrderItem[]
  adjusted: AdjustedOrderItem[]
}
