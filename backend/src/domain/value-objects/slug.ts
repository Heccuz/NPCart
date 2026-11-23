import { DomainError } from '../errors/domain-error'

/** Convierte texto libre a slug estable: "Mini Mediana (3-4 cm)" → "mini-mediana-3-4-cm". */
export function slugify(input: string): string {
  const slug = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
    .replace(/-+$/g, '')

  return slug || 'item'
}

export class Slug {
  private constructor(public readonly value: string) {}

  static from(input: string): Slug {
    const value = slugify(input)
    Slug.assertValid(value)
    return new Slug(value)
  }

  static assertValid(value: string): void {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 80) {
      throw new DomainError('INVALID_SLUG', `Slug inválido: "${value}"`)
    }
  }
}
