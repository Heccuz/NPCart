import { assertDomain } from '../errors/domain-error'
import { Money } from '../value-objects/money'

export interface CategoryOfferProps {
  id: string
  categoryId: string
  minQuantity: number
  unitPriceCents: number
  isActive: boolean
  createdAt: Date
  deletedAt: Date | null
}

/** Tramo de oferta por cantidad dentro de una categoría. */
export class CategoryOffer {
  private constructor(public readonly props: CategoryOfferProps) {}

  static create(input: {
    id?: string
    categoryId: string
    minQuantity: number
    unitPriceCents: number
    isActive?: boolean
  }): CategoryOffer {
    assertDomain(input.categoryId.length > 0, 'MISSING_CATEGORY', 'La categoría es obligatoria')
    assertDomain(
      Number.isInteger(input.minQuantity) && input.minQuantity >= 1,
      'INVALID_MIN_QUANTITY',
      'La cantidad mínima debe ser un entero >= 1',
    )
    const price = Money.fromCents(input.unitPriceCents)
    assertDomain(!price.isZero, 'INVALID_PRICE', 'El precio de oferta debe ser mayor que cero')

    return new CategoryOffer({
      id: input.id ?? '',
      categoryId: input.categoryId,
      minQuantity: input.minQuantity,
      unitPriceCents: input.unitPriceCents,
      isActive: input.isActive ?? true,
      createdAt: new Date(),
      deletedAt: null,
    })
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null
  }
}
