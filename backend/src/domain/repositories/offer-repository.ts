import type { OfferDto } from '../../application/dto/catalog'

export interface OfferInput {
  categoryId: string
  minQuantity: number
  unitPriceCents: number
  isActive?: boolean
}

export interface IOfferRepository {
  list(includeArchived: boolean): Promise<OfferDto[]>
  listActive(): Promise<OfferDto[]>
  listActiveByCategoryIds(categoryIds: string[]): Promise<OfferDto[]>
  listActiveByCategory(categoryId: string): Promise<OfferDto[]>
  findById(id: string): Promise<OfferDto | null>
  create(input: OfferInput): Promise<OfferDto>
  update(id: string, input: OfferInput): Promise<OfferDto>
  archive(id: string): Promise<void>
  restore(id: string): Promise<void>
}
