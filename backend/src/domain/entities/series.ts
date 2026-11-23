import { assertDomain } from '../errors/domain-error'
import { Slug } from '../value-objects/slug'

export interface SeriesProps {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  sortOrder: number
  createdAt: Date
  deletedAt: Date | null
}

/** Serie = temática. Eje de descubrimiento, N:M con productos. */
export class Series {
  private constructor(public readonly props: SeriesProps) {}

  static create(input: {
    id?: string
    name: string
    slug?: string
    imageUrl?: string | null
    sortOrder?: number
  }): Series {
    const name = input.name.trim()
    assertDomain(name.length >= 2 && name.length <= 80, 'INVALID_NAME', 'El nombre debe tener entre 2 y 80 caracteres')

    return new Series({
      id: input.id ?? '',
      name,
      slug: (input.slug ? Slug.from(input.slug) : Slug.from(name)).value,
      imageUrl: input.imageUrl?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
      createdAt: new Date(),
      deletedAt: null,
    })
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null
  }
}
