import type { PaginatedProducts, ProductDto, ProductListFilters } from '../../dto/catalog'
import type { IProductRepository } from '../../../domain/repositories/product-repository'
import type { ICategoryRepository } from '../../../domain/repositories/category-repository'
import type { ISeriesRepository } from '../../../domain/repositories/series-repository'
import type { IImageUrlResolver } from '../../ports/image-url-resolver'
import { Product } from '../../../domain/entities/product'
import { notFound, unprocessable } from '../../errors/app-error'

export interface ProductInput {
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

export class ProductUseCases {
  constructor(
    private readonly products: IProductRepository,
    private readonly categories: ICategoryRepository,
    private readonly series: ISeriesRepository,
    private readonly images: IImageUrlResolver,
  ) {}

  private map(dto: ProductDto): ProductDto {
    return { ...dto, imageUrl: this.images.resolve(dto.imageUrl) }
  }

  async listPublic(filters: ProductListFilters): Promise<PaginatedProducts> {
    const result = await this.products.list({
      ...filters,
      includeInactive: false,
      includeArchived: false,
      withFacets: true,
    })
    return { ...result, items: result.items.map((dto) => this.map(dto)) }
  }

  async listAdmin(filters: ProductListFilters): Promise<PaginatedProducts> {
    const result = await this.products.list({
      ...filters,
      includeInactive: true,
      includeArchived: true,
      withFacets: false,
    })
    return { ...result, items: result.items.map((dto) => this.map(dto)) }
  }

  async getPublic(id: string): Promise<ProductDto> {
    const dto = await this.products.findById(id)
    if (!dto || dto.deletedAt || !dto.isActive) {
      throw notFound('PRODUCT_NOT_FOUND', 'Producto no encontrado')
    }
    return this.map(dto)
  }

  async getAdmin(id: string): Promise<ProductDto> {
    const dto = await this.products.findById(id)
    if (!dto) throw notFound('PRODUCT_NOT_FOUND', 'Producto no encontrado')
    return this.map(dto)
  }

  async featured(limit = 8): Promise<ProductDto[]> {
    const items = await this.products.findFeatured(limit)
    return items.map((dto) => this.map(dto))
  }

  private async assertRefs(categoryId: string, seriesIds: string[]) {
    const category = await this.categories.findById(categoryId)
    if (!category || category.deletedAt) {
      throw unprocessable('CATEGORY_NOT_AVAILABLE', 'La categoría no existe o está archivada')
    }
    const series = await Promise.all(seriesIds.map((id) => this.series.findById(id)))
    if (series.some((item) => !item || item.deletedAt)) {
      throw unprocessable('SERIES_NOT_AVAILABLE', 'Alguna serie no existe o está archivada')
    }
  }

  private buildData(input: ProductInput) {
    const seriesIds = [...new Set(input.seriesIds)]
    const primarySeriesId = Product.resolvePrimarySeries(seriesIds, input.primarySeriesId)
    const entity = Product.create({ ...input, seriesIds, primarySeriesId })
    const props = entity.props
    return {
      name: props.name,
      categoryId: props.categoryId,
      primarySeriesId: props.primarySeriesId,
      seriesIds: props.seriesIds,
      priceCents: props.priceCents,
      imageUrl: props.imageUrl,
      details: props.details,
      stock: props.stock,
      isActive: props.isActive,
      isFeatured: props.isFeatured,
    }
  }

  async create(input: ProductInput): Promise<ProductDto> {
    await this.assertRefs(input.categoryId, input.seriesIds)
    const data = this.buildData(input)
    const dto = await this.products.create(data)
    return this.map(dto)
  }

  async update(id: string, input: ProductInput): Promise<ProductDto> {
    const existing = await this.products.findById(id)
    if (!existing) throw notFound('PRODUCT_NOT_FOUND', 'Producto no encontrado')
    if (existing.deletedAt) {
      throw unprocessable('PRODUCT_ARCHIVED', 'Restaura el producto antes de editarlo')
    }
    await this.assertRefs(input.categoryId, input.seriesIds)
    const data = this.buildData(input)
    const dto = await this.products.update(id, data)
    return this.map(dto)
  }

  async archive(id: string): Promise<void> {
    const existing = await this.products.findById(id)
    if (!existing) throw notFound('PRODUCT_NOT_FOUND', 'Producto no encontrado')
    await this.products.archive(id)
  }

  async restore(id: string): Promise<void> {
    const existing = await this.products.findById(id)
    if (!existing) throw notFound('PRODUCT_NOT_FOUND', 'Producto no encontrado')
    await this.products.restore(id)
  }

  async toggleActive(id: string, isActive: boolean): Promise<ProductDto> {
    const existing = await this.products.findById(id)
    if (!existing) throw notFound('PRODUCT_NOT_FOUND', 'Producto no encontrado')
    return this.map(await this.products.setActive(id, isActive))
  }

  async toggleFeatured(id: string, isFeatured: boolean): Promise<ProductDto> {
    const existing = await this.products.findById(id)
    if (!existing) throw notFound('PRODUCT_NOT_FOUND', 'Producto no encontrado')
    return this.map(await this.products.setFeatured(id, isFeatured))
  }
}
