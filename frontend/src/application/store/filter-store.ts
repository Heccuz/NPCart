import { create } from 'zustand'

interface FilterUiState {
  open: boolean
  setOpen: (open: boolean) => void
}

/** Estado de UI del bottom sheet de filtros (móvil). Los filtros viven en la URL. */
export const useFilterStore = create<FilterUiState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))
