import { describe, expect, it } from 'vitest'
import type { Order, OrderCategorySummary } from '@/domain/entities'
import { formatCents } from '@/domain/money'
import { buildWhatsAppMessage } from './build-whatsapp-message'

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    code: 'NPC-8F3K',
    status: 'PENDIENTE',
    subtotalCents: 8500,
    discountCents: 1500,
    totalCents: 7000,
    createdAt: new Date().toISOString(),
    confirmedAt: null,
    items: [
      {
        productId: 'p1',
        name: 'Spiderman Clásico',
        categoryName: 'Mini mediana',
        seriesName: 'Spiderman',
        unitPriceCents: 1200,
        qty: 2,
        lineTotalCents: 2400,
      },
      {
        productId: 'p2',
        name: 'Dragón Rojo',
        categoryName: 'Mini grande',
        seriesName: 'D&D',
        unitPriceCents: 2500,
        qty: 1,
        lineTotalCents: 2500,
      },
    ],
    ...overrides,
  }
}

const categories: OrderCategorySummary[] = [
  {
    categoryId: 'c1',
    categoryName: 'Mini mediana',
    units: 2,
    appliedOffer: { minQuantity: 5, unitPriceCents: 1200 },
    discountCents: 600,
  },
  {
    categoryId: 'c2',
    categoryName: 'Mini grande',
    units: 1,
    appliedOffer: null,
    discountCents: 0,
  },
]

describe('buildWhatsAppMessage', () => {
  it('includes code, grouped lines and total', () => {
    const message = buildWhatsAppMessage(makeOrder(), categories)
    expect(message).toContain('*Código: NPC-8F3K*')
    expect(message).toContain('*Mini mediana*')
    expect(message).toContain('*Mini grande*')
    expect(message).toContain(
      `• Spiderman Clásico (Spiderman) — 2 x ${formatCents(1200)}`,
    )
    expect(message).toContain(`Ahorro total: ${formatCents(1500)}`)
    expect(message).toContain(`*Total: ${formatCents(7000)}*`)
  })

  it('adds the applied offer note only when there is a real discount', () => {
    const message = buildWhatsAppMessage(makeOrder(), categories)
    expect(message).toContain('🎁 Oferta 5+')
    expect(message).toContain(`ahorras ${formatCents(600)}`)

    const noDiscount = buildWhatsAppMessage(makeOrder({ discountCents: 0 }), [])
    expect(noDiscount).not.toContain('🎁')
    expect(noDiscount).not.toContain('Ahorro total')
  })

  it('uses the order totals snapshot, never recomputes prices', () => {
    const message = buildWhatsAppMessage(makeOrder({ totalCents: 1234, discountCents: 0 }), [])
    expect(message).toContain(`*Total: ${formatCents(1234)}*`)
  })

  it('collapses long orders while keeping totals intact', () => {
    const items = Array.from({ length: 60 }, (_, index) => ({
      productId: `p${index}`,
      name: `Mini con nombre larguísimo número ${index} de la colección especial`,
      categoryName: 'Mini mediana',
      seriesName: 'Dungeons & Dragons',
      unitPriceCents: 1200,
      qty: 2,
      lineTotalCents: 2400,
    }))
    const message = buildWhatsAppMessage(
      makeOrder({
        items,
        subtotalCents: 200_000,
        discountCents: 20_000,
        totalCents: 180_000,
      }),
      categories,
    )

    expect(message.length).toBeLessThanOrEqual(1800)
    expect(message).toContain('…y ')
    expect(message).toContain(`*Total: ${formatCents(180_000)}*`)
    expect(message).toContain(`Ahorro total: ${formatCents(20_000)}`)
    expect(message).toContain('*Código: NPC-8F3K*')
  })
})
