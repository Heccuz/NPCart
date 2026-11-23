import { describe, expect, it } from 'vitest'
import {
  getNextOffer,
  pickOfferForUnits,
  priceCart,
  validateOfferTiers,
  type CartLineInput,
  type OfferTier,
} from './offerPricing'

const line = (overrides: Partial<CartLineInput> = {}): CartLineInput => ({
  productId: 'p1',
  categoryId: 'mediana',
  unitPriceCents: 1500,
  qty: 1,
  ...overrides,
})

const tier = (overrides: Partial<OfferTier> = {}): OfferTier => ({
  categoryId: 'mediana',
  minQuantity: 5,
  unitPriceCents: 1200,
  ...overrides,
})

describe('priceCart', () => {
  it('returns regular totals when there are no offers', () => {
    const result = priceCart(
      [line({ qty: 2 }), line({ productId: 'p2', categoryId: 'grande', unitPriceCents: 2500 })],
      [],
    )
    expect(result.subtotalCents).toBe(5500)
    expect(result.discountCents).toBe(0)
    expect(result.totalCents).toBe(5500)
    expect(result.lines.every((l) => !l.offerApplied)).toBe(true)
  })

  it('applies the offer when the threshold is reached exactly', () => {
    const result = priceCart([line({ qty: 5 })], [tier()])
    expect(result.subtotalCents).toBe(7500)
    expect(result.discountCents).toBe(1500)
    expect(result.totalCents).toBe(6000)
    expect(result.lines[0]!.effectiveUnitPriceCents).toBe(1200)
    expect(result.categories[0]!.offer?.minQuantity).toBe(5)
  })

  it('does not apply the offer below the threshold', () => {
    const result = priceCart([line({ qty: 4 })], [tier()])
    expect(result.discountCents).toBe(0)
    expect(result.categories[0]!.offer).toBeNull()
    expect(result.categories[0]!.unitsToNextOffer).toBe(1)
  })

  it('sums units across products of the same category', () => {
    const result = priceCart(
      [
        line({ productId: 'a', qty: 2 }),
        line({ productId: 'b', qty: 3 }),
        line({ productId: 'c', categoryId: 'grande', unitPriceCents: 2500, qty: 1 }),
      ],
      [tier()],
    )
    expect(result.categories).toHaveLength(2)
    expect(result.categories[0]!.units).toBe(5)
    expect(result.categories[0]!.discountCents).toBe(1500)
    expect(result.categories[1]!.discountCents).toBe(0)
  })

  it('picks the highest reached tier for all units', () => {
    const result = priceCart(
      [line({ qty: 10 })],
      [tier({ minQuantity: 5, unitPriceCents: 1200 }), tier({ minQuantity: 10, unitPriceCents: 1000 })],
    )
    expect(result.lines[0]!.effectiveUnitPriceCents).toBe(1000)
    expect(result.discountCents).toBe(5000)
    expect(result.totalCents).toBe(10000)
  })

  it('never raises a cheaper product above its own price', () => {
    const result = priceCart([line({ unitPriceCents: 800, qty: 5 })], [tier({ unitPriceCents: 1200 })])
    expect(result.lines[0]!.effectiveUnitPriceCents).toBe(800)
    expect(result.lines[0]!.offerApplied).toBe(false)
    expect(result.discountCents).toBe(0)
    expect(result.categories[0]!.offer?.minQuantity).toBe(5)
  })

  it('discounts only the units that actually save money', () => {
    const result = priceCart(
      [line({ productId: 'a', qty: 3 }), line({ productId: 'b', unitPriceCents: 800, qty: 2 })],
      [tier()],
    )
    expect(result.subtotalCents).toBe(6100)
    expect(result.totalCents).toBe(5200)
    expect(result.discountCents).toBe(900)
    expect(result.lines[1]!.offerApplied).toBe(false)
  })

  it('reports the next reachable tier for the progress bar', () => {
    const offers = [tier({ minQuantity: 5 }), tier({ minQuantity: 10, unitPriceCents: 1000 })]
    const result = priceCart([line({ qty: 3 })], offers)
    expect(result.categories[0]!.nextOffer?.minQuantity).toBe(5)
    expect(result.categories[0]!.unitsToNextOffer).toBe(2)
  })

  it('keeps input line order and category order of first appearance', () => {
    const result = priceCart(
      [
        line({ productId: 'z', categoryId: 'grande', unitPriceCents: 2500 }),
        line({ productId: 'a', categoryId: 'mediana' }),
      ],
      [],
    )
    expect(result.lines.map((l) => l.productId)).toEqual(['z', 'a'])
    expect(result.categories.map((c) => c.categoryId)).toEqual(['grande', 'mediana'])
  })

  it('rejects invalid quantities', () => {
    expect(() => priceCart([line({ qty: 0 })], [])).toThrow(TypeError)
    expect(() => priceCart([line({ qty: 1.5 })], [])).toThrow(TypeError)
  })
})

describe('tier helpers', () => {
  it('pickOfferForUnits picks highest tier, tie-break lowest price', () => {
    const offers = [tier({ minQuantity: 5, unitPriceCents: 1200 }), tier({ minQuantity: 5, unitPriceCents: 1100 })]
    expect(pickOfferForUnits(offers, 5)?.unitPriceCents).toBe(1100)
    expect(pickOfferForUnits(offers, 4)).toBeNull()
  })

  it('getNextOffer returns the closest unreached tier', () => {
    const offers = [tier({ minQuantity: 10, unitPriceCents: 1000 }), tier({ minQuantity: 5 })]
    expect(getNextOffer(offers, 3)?.minQuantity).toBe(5)
    expect(getNextOffer(offers, 7)?.minQuantity).toBe(10)
    expect(getNextOffer(offers, 10)).toBeNull()
  })
})

describe('validateOfferTiers', () => {
  it('accepts strictly decreasing tiers', () => {
    expect(
      validateOfferTiers([
        tier({ minQuantity: 5, unitPriceCents: 1200 }),
        tier({ minQuantity: 10, unitPriceCents: 1000 }),
      ]),
    ).toEqual([])
  })

  it('rejects duplicate minQuantity per category', () => {
    const errors = validateOfferTiers([
      tier({ minQuantity: 5, unitPriceCents: 1200 }),
      tier({ minQuantity: 5, unitPriceCents: 1100 }),
    ])
    expect(errors.map((e) => e.code)).toContain('DUPLICATE_TIER')
  })

  it('rejects a tier that does not get cheaper', () => {
    const errors = validateOfferTiers([
      tier({ minQuantity: 5, unitPriceCents: 1200 }),
      tier({ minQuantity: 10, unitPriceCents: 1200 }),
    ])
    expect(errors.map((e) => e.code)).toContain('NOT_DECREASING')
  })

  it('scopes tiers by category independently', () => {
    expect(
      validateOfferTiers([
        tier({ categoryId: 'mediana', minQuantity: 5, unitPriceCents: 1200 }),
        tier({ categoryId: 'grande', minQuantity: 5, unitPriceCents: 2500 }),
      ]),
    ).toEqual([])
  })

  it('rejects malformed tiers', () => {
    const errors = validateOfferTiers([tier({ minQuantity: 0 })])
    expect(errors.map((e) => e.code)).toContain('INVALID_TIER')
  })
})
