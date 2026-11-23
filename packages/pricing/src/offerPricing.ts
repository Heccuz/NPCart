/**
 * Regla de ofertas por cantidad — implementación única compartida
 * por backend y frontend. Todo en céntimos enteros.
 */

export interface OfferTier {
  categoryId: string
  minQuantity: number
  unitPriceCents: number
}

export interface CartLineInput {
  productId: string
  categoryId: string
  /** Precio regular del producto, en céntimos. */
  unitPriceCents: number
  qty: number
}

export interface PricedLine {
  productId: string
  categoryId: string
  unitPriceCents: number
  effectiveUnitPriceCents: number
  qty: number
  lineSubtotalCents: number
  lineTotalCents: number
  discountCents: number
  offerApplied: boolean
}

export interface CategoryBreakdown {
  categoryId: string
  units: number
  /** Tramo aplicado, si se alcanzó alguno. */
  offer: OfferTier | null
  /** Siguiente tramo alcanzable (para la barra de progreso). */
  nextOffer: OfferTier | null
  unitsToNextOffer: number
  subtotalCents: number
  discountCents: number
  totalCents: number
}

export interface CartPricing {
  lines: PricedLine[]
  categories: CategoryBreakdown[]
  subtotalCents: number
  discountCents: number
  totalCents: number
}

function assertCents(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${field} debe ser un entero de céntimos >= 0 (recibido: ${value})`)
  }
}

function isValidTier(tier: OfferTier): boolean {
  return (
    tier.categoryId.length > 0 &&
    Number.isInteger(tier.minQuantity) &&
    tier.minQuantity >= 1 &&
    Number.isInteger(tier.unitPriceCents) &&
    tier.unitPriceCents > 0
  )
}

function sortTiers(offers: OfferTier[]): OfferTier[] {
  return [...offers].sort(
    (a, b) => a.minQuantity - b.minQuantity || a.unitPriceCents - b.unitPriceCents,
  )
}

/** Mejor tramo alcanzado: mayor minQuantity; empate → menor precio. */
export function pickOfferForUnits(offers: OfferTier[], units: number): OfferTier | null {
  let best: OfferTier | null = null
  for (const offer of offers) {
    if (!isValidTier(offer) || offer.minQuantity > units) continue
    if (
      !best ||
      offer.minQuantity > best.minQuantity ||
      (offer.minQuantity === best.minQuantity && offer.unitPriceCents < best.unitPriceCents)
    ) {
      best = offer
    }
  }
  return best
}

/** Siguiente tramo por alcanzar (el más cercano por encima de units). */
export function getNextOffer(offers: OfferTier[], units: number): OfferTier | null {
  let next: OfferTier | null = null
  for (const offer of offers) {
    if (!isValidTier(offer) || offer.minQuantity <= units) continue
    if (!next || offer.minQuantity < next.minQuantity) next = offer
  }
  return next
}

/**
 * Calcula el carrito completo. Las unidades se agrupan por categoría
 * (mezclando series libremente). La oferta nunca encarece una línea.
 * Las unidades cuyo precio regular ya es menor que el de la oferta
 * cuentan para el tramo pero conservan su precio.
 */
export function priceCart(lines: CartLineInput[], offers: OfferTier[]): CartPricing {
  const validOffers = offers.filter(isValidTier)

  const offersByCategory = new Map<string, OfferTier[]>()
  for (const offer of validOffers) {
    const list = offersByCategory.get(offer.categoryId) ?? []
    list.push(offer)
    offersByCategory.set(offer.categoryId, list)
  }

  const linesByCategory = new Map<string, CartLineInput[]>()
  const categoryOrder: string[] = []
  for (const line of lines) {
    if (line.categoryId.length === 0) throw new TypeError('categoryId requerido en cada línea')
    if (line.productId.length === 0) throw new TypeError('productId requerido en cada línea')
    assertCents(line.unitPriceCents, 'unitPriceCents')
    if (!Number.isInteger(line.qty) || line.qty <= 0) {
      throw new TypeError(`qty debe ser un entero > 0 (recibido: ${line.qty})`)
    }
    if (!linesByCategory.has(line.categoryId)) categoryOrder.push(line.categoryId)
    const list = linesByCategory.get(line.categoryId) ?? []
    list.push(line)
    linesByCategory.set(line.categoryId, list)
  }

  const pricedLines: PricedLine[] = []
  const categories: CategoryBreakdown[] = []

  for (const categoryId of categoryOrder) {
    const categoryLines = linesByCategory.get(categoryId) ?? []
    const units = categoryLines.reduce((sum, line) => sum + line.qty, 0)
    const catOffers = offersByCategory.get(categoryId) ?? []
    const offer = pickOfferForUnits(catOffers, units)
    const nextOffer = getNextOffer(catOffers, units)

    let catSubtotal = 0
    let catDiscount = 0

    for (const line of categoryLines) {
      const effectiveUnitPriceCents = offer
        ? Math.min(line.unitPriceCents, offer.unitPriceCents)
        : line.unitPriceCents
      const lineSubtotalCents = line.unitPriceCents * line.qty
      const lineTotalCents = effectiveUnitPriceCents * line.qty
      const discountCents = lineSubtotalCents - lineTotalCents

      catSubtotal += lineSubtotalCents
      catDiscount += discountCents

      pricedLines.push({
        productId: line.productId,
        categoryId,
        unitPriceCents: line.unitPriceCents,
        effectiveUnitPriceCents,
        qty: line.qty,
        lineSubtotalCents,
        lineTotalCents,
        discountCents,
        offerApplied: discountCents > 0,
      })
    }

    categories.push({
      categoryId,
      units,
      offer,
      nextOffer,
      unitsToNextOffer: nextOffer ? nextOffer.minQuantity - units : 0,
      subtotalCents: catSubtotal,
      discountCents: catDiscount,
      totalCents: catSubtotal - catDiscount,
    })
  }

  const subtotalCents = categories.reduce((sum, cat) => sum + cat.subtotalCents, 0)
  const discountCents = categories.reduce((sum, cat) => sum + cat.discountCents, 0)

  return {
    lines: pricedLines,
    categories,
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
  }
}

export type TierValidationErrorCode = 'INVALID_TIER' | 'DUPLICATE_TIER' | 'NOT_DECREASING'

export interface TierValidationError {
  code: TierValidationErrorCode
  categoryId: string
  minQuantity: number
  message: string
}

/**
 * Valida los tramos de una o varias categorías al crear/editar ofertas:
 * unicidad (categoryId, minQuantity) y precio estrictamente decreciente
 * al subir de tramo.
 */
export function validateOfferTiers(offers: OfferTier[]): TierValidationError[] {
  const errors: TierValidationError[] = []

  for (const offer of offers) {
    if (!isValidTier(offer)) {
      errors.push({
        code: 'INVALID_TIER',
        categoryId: offer.categoryId,
        minQuantity: offer.minQuantity,
        message: 'Cada tramo exige minQuantity entero >= 1 y unitPriceCents entero > 0',
      })
    }
  }

  const byCategory = new Map<string, OfferTier[]>()
  for (const offer of offers) {
    if (!isValidTier(offer)) continue
    const list = byCategory.get(offer.categoryId) ?? []
    list.push(offer)
    byCategory.set(offer.categoryId, list)
  }

  for (const [categoryId, tiers] of byCategory) {
    const sorted = sortTiers(tiers)
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i]!
      const previous = i > 0 ? sorted[i - 1]! : null
      if (previous && previous.minQuantity === current.minQuantity) {
        errors.push({
          code: 'DUPLICATE_TIER',
          categoryId,
          minQuantity: current.minQuantity,
          message: `Ya existe un tramo con minQuantity ${current.minQuantity}`,
        })
        continue
      }
      if (previous && current.unitPriceCents >= previous.unitPriceCents) {
        errors.push({
          code: 'NOT_DECREASING',
          categoryId,
          minQuantity: current.minQuantity,
          message: `El tramo ${current.minQuantity}+ debe costar menos que el tramo ${previous.minQuantity}+`,
        })
      }
    }
  }

  return errors
}
