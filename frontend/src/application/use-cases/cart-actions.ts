import type { CartItem, Product } from '@/domain/entities'

/** Mapea un producto del catálogo a la forma del carrito (snapshot de display). */
export function productToCartItem(product: Product): Omit<CartItem, 'qty'> {
  return {
    productId: product.id,
    name: product.name,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    seriesName: product.primarySeries.name,
    priceCents: product.priceCents,
    imageUrl: product.imageUrl,
    stock: product.stock,
  }
}
