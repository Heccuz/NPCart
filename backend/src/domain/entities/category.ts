import { assertDomain } from '../errors/domain-error'
import { Money } from '../value-objects/money'
import { Slug } from '../value-objects/slug'

export interface CategoryProps {
  id: string
  name: string
  slug: string
  basePriceCents: number
  sortOrder: number
  createdAt: Date
  deletedAt: Date | null
}

/** Categoría = tamaño de la mini. Eje de precio y de ofertas. */
export class Category {
  private constructor(public readonly props: CategoryProps) {}

  static create(input: {
    id?: string
    name: string
    slug?: string
    basePriceCents: number
    sortOrder?: number
  }): Category {
    const name = input.name.trim()
    assertDomain(name.length >= 2 && name.length <= 80, 'INVALID_NAME', 'El nombre debe tener entre 2 y 80 caracteres')
    Money.fromCents(input.basePriceCents)

    return new Category({
      id: input.id ?? '',
      name,
      slug: (input.slug ? Slug.from(input.slug) : Slug.from(name)).value,
      basePriceCents: input.basePriceCents,
      sortOrder: input.sortOrder ?? 0,
      createdAt: new Date(),
      deletedAt: null,
    })
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null
  }
}
