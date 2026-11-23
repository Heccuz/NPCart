import type { ReactNode } from 'react'
import type { Category, Product, ProductSort, Series } from '@/domain/entities'
import { productToCartItem } from '@/application/use-cases/cart-actions'
import { useFilterStore } from '@/application/store/filter-store'
import EmptyState from '@/presentation/components/EmptyState'
import FilterPanel from '@/presentation/components/FilterPanel'
import ProductGrid from '@/presentation/components/ProductGrid'
import SearchBar from '@/presentation/components/SearchBar'
import { useCart } from '@/presentation/hooks/useCart'
import {
  PAGE_SIZE,
  SORT_OPTIONS,
  useCatalogFilters,
} from '@/presentation/hooks/useCatalogFilters'
import {
  useCategories,
  useOffers,
  useProducts,
  useSeries,
} from '@/presentation/hooks/useProducts'
import { cn } from '@/presentation/lib/cn'

function FilterSheet({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Cerrar filtros"
        onClick={onClose}
        className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl bg-bone shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Filtros</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-lg"
            aria-label="Cerrar filtros"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        <div className="border-t border-ink/10 px-5 py-4">
          <button type="button" onClick={onClose} className="btn-primary h-12 w-full">
            Ver resultados
          </button>
        </div>
      </div>
    </div>
  )
}

function ActiveChips({
  categories,
  series,
  filters,
  onToggleCategory,
  onToggleSeries,
}: {
  categories: Category[]
  series: Series[]
  filters: { categories: string[]; series: string[] }
  onToggleCategory: (slug: string) => void
  onToggleSeries: (slug: string) => void
}) {
  const categoryChips = filters.categories.map((slug) => ({
    key: `cat-${slug}`,
    label: categories.find((category) => category.slug === slug)?.name ?? slug,
    onRemove: () => onToggleCategory(slug),
  }))
  const seriesChips = filters.series.map((slug) => ({
    key: `ser-${slug}`,
    label: series.find((item) => item.slug === slug)?.name ?? slug,
    onRemove: () => onToggleSeries(slug),
  }))

  return (
    <>
      {[...categoryChips, ...seriesChips].map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-ink px-3 py-1.5 text-xs font-semibold text-bone"
        >
          {chip.label}
          <span aria-hidden="true">✕</span>
        </button>
      ))}
    </>
  )
}

export default function CatalogPage() {
  const { filters, update, toggleCategory, toggleSeries, setPage, clear, hasActiveFilters } =
    useCatalogFilters()
  const { data: categories = [] } = useCategories()
  const { data: series = [] } = useSeries()
  const { data: offers = [] } = useOffers()
  const { addItem } = useCart()
  const sheetOpen = useFilterStore((state) => state.open)
  const setSheetOpen = useFilterStore((state) => state.setOpen)

  const { data, isLoading, isFetching, isError, refetch } = useProducts({
    categories: filters.categories,
    series: filters.series,
    q: filters.q,
    minPrice: filters.minPriceCents,
    maxPrice: filters.maxPriceCents,
    inStock: filters.inStock,
    sort: filters.sort,
    page: filters.page,
    pageSize: PAGE_SIZE,
  })

  const products: Product[] = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeCount =
    filters.categories.length +
    filters.series.length +
    (filters.inStock ? 1 : 0) +
    (filters.q ? 1 : 0) +
    (filters.minPriceCents != null || filters.maxPriceCents != null ? 1 : 0)

  const filterProps = {
    filters,
    categories,
    series,
    facets: data?.facets ?? null,
    onToggleCategory: toggleCategory,
    onToggleSeries: toggleSeries,
    onUpdate: update,
    onClear: clear,
  }

  return (
    <>
      <div className="container-page py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Elige tu próxima mini
            </h1>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="btn-ghost h-11 flex-1 text-sm lg:hidden"
            >
              Filtros{activeCount > 0 ? ` (${activeCount})` : ''}
            </button>
            <select
              aria-label="Ordenar productos"
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value as ProductSort })}
              className="input h-11 w-full bg-white/70 text-sm sm:w-56"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <SearchBar value={filters.q} onChange={(q) => update({ q })} />
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <FilterPanel {...filterProps} />
            </div>
          </aside>

          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <p className="mr-1 text-sm text-ink/60">
                {total} {total === 1 ? 'mini' : 'minis'}
                {isFetching && !isLoading && <span className="ml-2 text-ink/60">actualizando…</span>}
              </p>
              <ActiveChips
                categories={categories}
                series={series}
                filters={filters}
                onToggleCategory={toggleCategory}
                onToggleSeries={toggleSeries}
              />
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs font-semibold text-ink/60 underline-offset-4 hover:text-ink hover:underline"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            <ProductGrid
              products={products}
              offers={offers}
              loading={isLoading}
              onQuickAdd={(product) => addItem(productToCartItem(product))}
              emptyState={
                isError && products.length === 0 ? (
                  <EmptyState
                    title="No pudimos cargar el catálogo"
                    description="Revisa tu conexión e intenta de nuevo."
                    actionLabel="Reintentar"
                    onAction={() => refetch()}
                  />
                ) : (
                  <EmptyState
                    title="Ninguna mini coincide"
                    description="Prueba quitando algún filtro o busca por otra temática."
                    actionLabel="Limpiar filtros"
                    onAction={clear}
                  />
                )
              }
            />

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage(filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="btn-ghost h-10 px-4 text-sm"
                >
                  Anterior
                </button>
                <span className={cn('text-sm text-ink/60')}>
                  Página {Math.min(filters.page, totalPages)} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                  className="btn-ghost h-10 px-4 text-sm"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <FilterPanel {...filterProps} />
      </FilterSheet>
    </>
  )
}
