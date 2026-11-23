import type {
  Category,
  CategoryOffer,
  Order,
  OrderStatus,
  Product,
  ProductListResponse,
  Series,
  StockWarning,
} from '@/domain/entities'
import type { ProductQuery } from './product-gateway'

export interface AdminProductInput {
  name: string
  categoryId: string
  primarySeriesId: string
  seriesIds: string[]
  priceCents: number
  imageUrl?: string
  details?: string
  stock: number
  isActive?: boolean
  isFeatured?: boolean
}

export interface AdminCategoryInput {
  name: string
  slug?: string
  basePriceCents: number
  sortOrder?: number
}

export interface AdminSeriesInput {
  name: string
  slug?: string
  imageUrl?: string | null
  sortOrder?: number
}

export interface AdminOfferInput {
  categoryId: string
  minQuantity: number
  unitPriceCents: number
  isActive?: boolean
}

export interface AdminOrderQuery {
  status?: OrderStatus
  q?: string
  page?: number
  pageSize?: number
}

export interface IAdminGateway {
  listProducts(query: ProductQuery): Promise<ProductListResponse>
  createProduct(input: AdminProductInput): Promise<Product>
  updateProduct(id: string, input: AdminProductInput): Promise<Product>
  archiveProduct(id: string): Promise<void>
  restoreProduct(id: string): Promise<void>
  setProductActive(id: string, isActive: boolean): Promise<Product>
  setProductFeatured(id: string, isFeatured: boolean): Promise<Product>

  listCategories(): Promise<Category[]>
  createCategory(input: AdminCategoryInput): Promise<Category>
  updateCategory(id: string, input: AdminCategoryInput): Promise<Category>
  archiveCategory(id: string): Promise<void>
  restoreCategory(id: string): Promise<void>

  listSeries(): Promise<Series[]>
  createSeries(input: AdminSeriesInput): Promise<Series>
  updateSeries(id: string, input: AdminSeriesInput): Promise<Series>
  archiveSeries(id: string): Promise<void>
  restoreSeries(id: string): Promise<void>

  listOffers(): Promise<CategoryOffer[]>
  createOffer(input: AdminOfferInput): Promise<CategoryOffer>
  updateOffer(id: string, input: AdminOfferInput): Promise<CategoryOffer>
  archiveOffer(id: string): Promise<void>
  restoreOffer(id: string): Promise<void>

  listOrders(query: AdminOrderQuery): Promise<{ items: Order[]; total: number }>
  confirmOrder(id: string): Promise<{ order: Order; warnings: StockWarning[] }>
  cancelOrder(id: string): Promise<Order>
}
