import { assertDomain } from '../errors/domain-error'
import { Stock } from '../value-objects/stock'
import { Money } from '../value-objects/money'

export interface ProductProps {
  id: string
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
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

/** Mini concreta: una categoría (tamaño) y una o más series (temática). */
export class Product {
  private constructor(public readonly props: ProductProps) {}

  static create(input: {
    id?: string
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
  }): Product {
    const name = input.name.trim()
    assertDomain(name.length >= 2 && name.length <= 120, 'INVALID_NAME', 'El nombre debe tener entre 2 y 120 caracteres')
    assertDomain(input.categoryId.length > 0, 'MISSING_CATEGORY', 'La categoría es obligatoria')
    Money.fromCents(input.priceCents)
    Stock.from(input.stock)

    const seriesIds = [...new Set(input.seriesIds.filter(Boolean))]
    assertDomain(seriesIds.length >= 1, 'MISSING_SERIES', 'El producto necesita al menos una serie')
    assertDomain(
      seriesIds.includes(input.primarySeriesId),
      'PRIMARY_SERIES_NOT_IN_LIST',
      'La serie principal debe estar entre las series del producto',
    )

    return new Product({
      id: input.id ?? '',
      name,
      categoryId: input.categoryId,
      primarySeriesId: input.primarySeriesId,
      seriesIds,
      priceCents: input.priceCents,
      imageUrl: input.imageUrl?.trim() ?? '',
      details: input.details?.trim() ?? '',
      stock: input.stock,
      isActive: input.isActive ?? true,
      isFeatured: input.isFeatured ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })
  }

  /** Reasigna la principal promoviendo otra serie cuando la actual sale de la lista. */
  static resolvePrimarySeries(seriesIds: string[], requestedPrimaryId: string): string {
    assertDomain(seriesIds.length >= 1, 'MISSING_SERIES', 'El producto necesita al menos una serie')
    if (seriesIds.includes(requestedPrimaryId)) return requestedPrimaryId
    return seriesIds[0]!
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null
  }

  get isSoldOut(): boolean {
    return this.props.stock === 0
  }
}
