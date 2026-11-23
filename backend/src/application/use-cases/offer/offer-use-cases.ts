import { validateOfferTiers, type OfferTier } from '@npcart/pricing'
import type { OfferDto } from '../../dto/catalog'
import type { IOfferRepository } from '../../../domain/repositories/offer-repository'
import type { ICategoryRepository } from '../../../domain/repositories/category-repository'
import { CategoryOffer } from '../../../domain/entities/category-offer'
import { notFound, unprocessable } from '../../errors/app-error'

export interface OfferInput {
  categoryId: string
  minQuantity: number
  unitPriceCents: number
  isActive?: boolean
}

export class OfferUseCases {
  constructor(
    private readonly offers: IOfferRepository,
    private readonly categories: ICategoryRepository,
  ) {}

  async listPublic(): Promise<OfferDto[]> {
    return (await this.offers.listActive()).filter((offer) => offer.isActive)
  }

  listAdmin(): Promise<OfferDto[]> {
    return this.offers.list(true)
  }

  private async assertCategory(categoryId: string) {
    const category = await this.categories.findById(categoryId)
    if (!category || category.deletedAt) {
      throw unprocessable('CATEGORY_NOT_AVAILABLE', 'La categoría no existe o está archivada')
    }
  }

  private assertTiers(active: OfferDto[], input: OfferInput) {
    const tiers: OfferTier[] = [...active, input].map((offer) => ({
      categoryId: offer.categoryId,
      minQuantity: offer.minQuantity,
      unitPriceCents: offer.unitPriceCents,
    }))
    const errors = validateOfferTiers(tiers)
    if (errors.length > 0) {
      throw unprocessable('INVALID_OFFER_TIERS', errors.map((error) => error.message).join(' · '))
    }
  }

  async create(input: OfferInput): Promise<OfferDto> {
    await this.assertCategory(input.categoryId)
    const entity = CategoryOffer.create(input)
    const active = await this.offers.listActiveByCategory(input.categoryId)
    this.assertTiers(active, input)
    return this.offers.create({
      categoryId: entity.props.categoryId,
      minQuantity: entity.props.minQuantity,
      unitPriceCents: entity.props.unitPriceCents,
      isActive: entity.props.isActive,
    })
  }

  async update(id: string, input: OfferInput): Promise<OfferDto> {
    const existing = await this.offers.findById(id)
    if (!existing) throw notFound('OFFER_NOT_FOUND', 'Oferta no encontrada')
    if (existing.deletedAt) {
      throw unprocessable('OFFER_ARCHIVED', 'Restaura la oferta antes de editarla')
    }
    await this.assertCategory(input.categoryId)
    const entity = CategoryOffer.create(input)
    const active = (await this.offers.listActiveByCategory(input.categoryId)).filter(
      (offer) => offer.id !== id,
    )
    this.assertTiers(active, input)
    return this.offers.update(id, {
      categoryId: entity.props.categoryId,
      minQuantity: entity.props.minQuantity,
      unitPriceCents: entity.props.unitPriceCents,
      isActive: entity.props.isActive,
    })
  }

  async archive(id: string): Promise<void> {
    const existing = await this.offers.findById(id)
    if (!existing) throw notFound('OFFER_NOT_FOUND', 'Oferta no encontrada')
    await this.offers.archive(id)
  }

  async restore(id: string): Promise<void> {
    const existing = await this.offers.findById(id)
    if (!existing) throw notFound('OFFER_NOT_FOUND', 'Oferta no encontrada')
    await this.offers.restore(id)
  }
}
