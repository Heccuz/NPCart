import type { PersistStorage } from 'zustand/middleware'
import type { CartItem } from '@/domain/entities'

/**
 * Adaptador de persistencia del carrito: payload versionado.
 * Un cambio incompatible de CartItem invalida el carrito guardado
 * en vez de romper la app.
 */
export const CART_STORAGE_VERSION = 1

interface CartPersistedState {
  items: CartItem[]
}

interface StoredCart {
  version: number
  items: CartItem[]
}

function isValidItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.productId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.categoryId === 'string' &&
    typeof item.categoryName === 'string' &&
    typeof item.seriesName === 'string' &&
    typeof item.priceCents === 'number' &&
    typeof item.stock === 'number' &&
    typeof item.qty === 'number' &&
    item.qty > 0
  )
}

export const localStorageCartStorage: PersistStorage<CartPersistedState> = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(name)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as Partial<StoredCart>
      if (parsed.version !== CART_STORAGE_VERSION || !Array.isArray(parsed.items)) {
        window.localStorage.removeItem(name)
        return null
      }
      const items = parsed.items.filter(isValidItem)
      return { state: { items }, version: CART_STORAGE_VERSION }
    } catch {
      window.localStorage.removeItem(name)
      return null
    }
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return
    const payload: StoredCart = { version: CART_STORAGE_VERSION, items: value.state.items }
    window.localStorage.setItem(name, JSON.stringify(payload))
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(name)
  },
}
