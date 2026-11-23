import type { CategoryDto } from '../../application/dto/catalog'

export interface CategoryInput {
  name: string
  slug?: string
  basePriceCents: number
  sortOrder?: number
}

export interface ICategoryRepository {
  list(includeArchived: boolean): Promise<CategoryDto[]>
  findById(id: string): Promise<CategoryDto | null>
  findBySlug(slug: string): Promise<CategoryDto | null>
  create(input: CategoryInput): Promise<CategoryDto>
  update(id: string, input: CategoryInput): Promise<CategoryDto>
  archive(id: string): Promise<void>
  restore(id: string): Promise<void>
  countActiveProducts(categoryId: string): Promise<number>
}
