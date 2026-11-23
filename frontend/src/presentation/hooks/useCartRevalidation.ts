import { useEffect, useRef } from 'react'
import type { CartItem } from '@/domain/entities'
import { useCartStore } from '@/application/store/cart-store'
import { productGateway } from '@/infrastructure/http/product-gateway'

/**
 * Al cargar el carrito desde localStorage, revalida contra la API:
 * quita productos agotados/desactivados, refresca precios y clampea
 * cantidades al stock. Un fallo de red conserva el ítem como estaba.
 */
export function useCartRevalidation() {
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const initialItems = useCartStore.getState().items
    if (initialItems.length === 0) return

    void (async () => {
      const results = await Promise.allSettled(
        initialItems.map((item) => productGateway.getById(item.productId)),
      )
      const currentItems = useCartStore.getState().items
      const next: CartItem[] = []

      for (let index = 0; index < initialItems.length; index++) {
        const result = results[index]
        const original = currentItems.find(
          (item) => item.productId === initialItems[index]!.productId,
        )
        if (!original) continue

        if (!result || result.status === 'rejected') {
          next.push(original)
          continue
        }

        const product = result.value
        if (!product || !product.isActive || product.deletedAt || product.stock <= 0) continue

        next.push({
          ...original,
          name: product.name,
          priceCents: product.priceCents,
          imageUrl: product.imageUrl,
          stock: product.stock,
          categoryId: product.categoryId,
          categoryName: product.category.name,
          seriesName: product.primarySeries.name,
          qty: Math.min(original.qty, product.stock),
        })
      }

      useCartStore.getState().replaceItems(next)
    })()
  }, [])
}
