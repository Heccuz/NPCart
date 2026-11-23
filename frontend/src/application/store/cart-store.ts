import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/domain/entities'
import { localStorageCartStorage } from '@/infrastructure/storage/local-storage-cart'

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  updateQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  replaceItems: (items: CartItem[]) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, qty = 1) =>
        set((state) => {
          if (item.stock <= 0) return state
          const existing = state.items.find((entry) => entry.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((entry) =>
                entry.productId === item.productId
                  ? { ...entry, ...item, qty: Math.min(entry.qty + qty, item.stock) }
                  : entry,
              ),
            }
          }
          return { items: [...state.items, { ...item, qty: Math.min(qty, item.stock) }] }
        }),
      updateQty: (productId, qty) =>
        set((state) => ({
          items: state.items
            .map((entry) =>
              entry.productId === productId
                ? { ...entry, qty: Math.max(1, Math.min(qty, entry.stock)) }
                : entry,
            )
            .filter((entry) => entry.qty > 0),
        })),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((entry) => entry.productId !== productId) })),
      clear: () => set({ items: [] }),
      replaceItems: (items) => set({ items }),
    }),
    {
      name: 'npcart.cart',
      version: 1,
      storage: localStorageCartStorage,
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
