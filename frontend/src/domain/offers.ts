import type { CategoryOffer } from './entities'

export function offersForCategory(offers: CategoryOffer[], categoryId: string): CategoryOffer[] {
  return offers
    .filter((offer) => offer.categoryId === categoryId && offer.isActive)
    .sort((a, b) => a.minQuantity - b.minQuantity)
}

/** Tramo de entrada (el que menos unidades exige) — el que se anuncia en tarjetas. */
export function entryOffer(offers: CategoryOffer[], categoryId: string): CategoryOffer | null {
  return offersForCategory(offers, categoryId)[0] ?? null
}
