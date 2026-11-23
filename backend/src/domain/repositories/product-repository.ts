import type {
  PaginatedProducts,
  ProductDto,
  ProductListFilters,
} from '../../application/dto/catalog'

export interface CreateProductData {
  name: string
  categoryId: string
  primarySeriesId: string
  seriesIds: string[]
  priceCents: number
  imageUrl: string
  details: string
  stock: number
  isActive: boolean
  isFeatured: boolean
}

export interface IProductRepository {
  list(filters: ProductListFilters): Promise<PaginatedProducts>
  findById(id: string): Promise<ProductDto | null>
  findByIds(ids: string[]): Promise<ProductDto[]>
  findFeatured(limit: number): Promise<ProductDto[]>
  create(data: CreateProductData): Promise<ProductDto>
  update(id: string, data: CreateProductData): Promise<ProductDto>
  archive(id: string): Promise<void>
  restore(id: string): Promise<void>
  setActive(id: string, isActive: boolean): Promise<ProductDto>
  setFeatured(id: string, isFeatured: boolean): Promise<ProductDto>
  countActiveByCategory(categoryId: string): Promise<number>
  countActiveByPrimarySeries(seriesId: string): Promise<number>
}
