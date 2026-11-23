import type { CategoryDto } from '../../dto/catalog'
import type { ICategoryRepository } from '../../../domain/repositories/category-repository'
import { Category } from '../../../domain/entities/category'
import { conflict, notFound, unprocessable } from '../../errors/app-error'

export interface CategoryInput {
  name: string
  slug?: string
  basePriceCents: number
  sortOrder?: number
}

export class CategoryUseCases {
  constructor(private readonly categories: ICategoryRepository) {}

  listPublic(): Promise<CategoryDto[]> {
    return this.categories.list(false)
  }

  listAdmin(): Promise<CategoryDto[]> {
    return this.categories.list(true)
  }

  async create(input: CategoryInput): Promise<CategoryDto> {
    const entity = Category.create(input)
    const existing = await this.categories.findBySlug(entity.props.slug)
    if (existing) {
      throw conflict('CATEGORY_SLUG_TAKEN', `Ya existe una categoría con el slug "${entity.props.slug}"`)
    }
    return this.categories.create({
      name: entity.props.name,
      slug: entity.props.slug,
      basePriceCents: entity.props.basePriceCents,
      sortOrder: entity.props.sortOrder,
    })
  }

  async update(id: string, input: CategoryInput): Promise<CategoryDto> {
    const existing = await this.categories.findById(id)
    if (!existing) throw notFound('CATEGORY_NOT_FOUND', 'Categoría no encontrada')
    if (existing.deletedAt) {
      throw unprocessable('CATEGORY_ARCHIVED', 'Restaura la categoría antes de editarla')
    }
    const entity = Category.create(input)
    const clash = await this.categories.findBySlug(entity.props.slug)
    if (clash && clash.id !== id) {
      throw conflict('CATEGORY_SLUG_TAKEN', `Ya existe una categoría con el slug "${entity.props.slug}"`)
    }
    return this.categories.update(id, {
      name: entity.props.name,
      slug: entity.props.slug,
      basePriceCents: entity.props.basePriceCents,
      sortOrder: entity.props.sortOrder,
    })
  }

  async archive(id: string): Promise<void> {
    const existing = await this.categories.findById(id)
    if (!existing) throw notFound('CATEGORY_NOT_FOUND', 'Categoría no encontrada')
    const activeProducts = await this.categories.countActiveProducts(id)
    if (activeProducts > 0) {
      throw conflict(
        'CATEGORY_HAS_PRODUCTS',
        `No puedes archivar: hay ${activeProducts} producto(s) activo(s) en esta categoría. Reasígnalos o archívalos primero.`,
      )
    }
    await this.categories.archive(id)
  }

  async restore(id: string): Promise<void> {
    const existing = await this.categories.findById(id)
    if (!existing) throw notFound('CATEGORY_NOT_FOUND', 'Categoría no encontrada')
    await this.categories.restore(id)
  }
}
