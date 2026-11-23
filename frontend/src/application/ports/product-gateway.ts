import type {
  Category,
  CategoryOffer,
  FacetCounts,
  Product,
  ProductListResponse,
  ProductSort,
  Series,
} from '@/domain/entities'

export interface ProductQuery {
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

export interface IProductGateway {
  list(query: ProductQuery): Promise<ProductListResponse>
  featured(): Promise<Product[]>
  getById(id: string): Promise<Product | null>
  listCategories(): Promise<Category[]>
  listSeries(): Promise<Series[]>
  listOffers(): Promise<CategoryOffer[]>
}

export type { FacetCounts, ProductListResponse }
