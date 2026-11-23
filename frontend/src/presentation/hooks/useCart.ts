import { useMemo } from 'react'
import { priceCart } from '@npcart/pricing'
import { useCartStore } from '@/application/store/cart-store'
import { useOffers } from './useProducts'

/** Carrito + pricing local instantáneo con la misma regla del backend. */
export function useCart() {
  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const updateQty = useCartStore((state) => state.updateQty)
  const removeItem = useCartStore((state) => state.removeItem)
  const clear = useCartStore((state) => state.clear)
  const { data: offers = [] } = useOffers()

  const activeOffers = useMemo(() => offers.filter((offer) => offer.isActive), [offers])

  const pricing = useMemo(
    () =>
      priceCart(
        items.map((item) => ({
          productId: item.productId,
          categoryId: item.categoryId,
          unitPriceCents: item.priceCents,
          qty: item.qty,
        })),
        activeOffers.map((offer) => ({
          categoryId: offer.categoryId,
          minQuantity: offer.minQuantity,
          unitPriceCents: offer.unitPriceCents,
        })),
      ),
    [items, activeOffers],
  )

  const lineByProduct = useMemo(
    () => new Map(pricing.lines.map((line) => [line.productId, line])),
    [pricing],
  )

  const count = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items])

  return {
    items,
    addItem,
    updateQty,
    removeItem,
    clear,
    pricing,
    lineByProduct,
    count,
    offers: activeOffers,
  }
}
