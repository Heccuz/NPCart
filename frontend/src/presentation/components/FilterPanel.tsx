import { useEffect, useState } from 'react'
import type { Category, FacetCounts, Series } from '@/domain/entities'
import type { CatalogFilters } from '../hooks/useCatalogFilters'
import { cn } from '../lib/cn'

interface FilterPanelProps {
  filters: CatalogFilters
  categories: Category[]
  series: Series[]
  facets: FacetCounts | null
  onToggleCategory: (slug: string) => void
  onToggleSeries: (slug: string) => void
  onUpdate: (patch: Partial<CatalogFilters>) => void
  onClear: () => void
}

function PriceRange({
  filters,
  onUpdate,
}: {
  filters: CatalogFilters
  onUpdate: (patch: Partial<CatalogFilters>) => void
}) {
  const [min, setMin] = useState(
    filters.minPriceCents != null ? String(filters.minPriceCents / 100) : '',
  )
  const [max, setMax] = useState(
    filters.maxPriceCents != null ? String(filters.maxPriceCents / 100) : '',
  )

  useEffect(() => {
    setMin(filters.minPriceCents != null ? String(filters.minPriceCents / 100) : '')
    setMax(filters.maxPriceCents != null ? String(filters.maxPriceCents / 100) : '')
  }, [filters.minPriceCents, filters.maxPriceCents])

  const apply = () => {
    const toCents = (raw: string) => {
      if (raw.trim() === '') return undefined
      const value = Number(raw)
      return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : undefined
    }
    onUpdate({ minPriceCents: toCents(min), maxPriceCents: toCents(max) })
  }

  return (
    <div>
      <p className="label">Precio (S/)</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="Mín"
          aria-label="Precio mínimo en soles"
          value={min}
          onChange={(event) => setMin(event.target.value)}
          onBlur={apply}
          onKeyDown={(event) => {
            if (event.key === 'Enter') (event.target as HTMLInputElement).blur()
          }}
          className="input h-11"
        />
        <span className="text-navy/60">—</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="Máx"
          aria-label="Precio máximo en soles"
          value={max}
          onChange={(event) => setMax(event.target.value)}
          onBlur={apply}
          onKeyDown={(event) => {
            if (event.key === 'Enter') (event.target as HTMLInputElement).blur()
          }}
          className="input h-11"
        />
      </div>
    </div>
  )
}

export default function FilterPanel({
  filters,
  categories,
  series,
  facets,
  onToggleCategory,
  onToggleSeries,
  onUpdate,
  onClear,
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="label">Tamaño</p>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => {
            const selected = filters.categories.includes(category.slug)
            const count = facets?.categories[category.slug] ?? 0
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onToggleCategory(category.slug)}
                disabled={!selected && count === 0}
                aria-pressed={selected}
                className={cn(
                  'flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition',
                  selected
                    ? 'border-navy bg-navy text-mist'
                    : 'border-navy/10 bg-surface text-navy hover:border-navy/40',
                  !selected && count === 0 && 'cursor-not-allowed opacity-40',
                )}
              >
                <span>{category.name}</span>
                <span className="text-[10px] font-medium opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="label">Serie</p>
        <div className="grid grid-cols-2 gap-2">
          {series.map((item) => {
            const selected = filters.series.includes(item.slug)
            const count = facets?.series[item.slug] ?? 0
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleSeries(item.slug)}
                disabled={!selected && count === 0}
                aria-pressed={selected}
                className={cn(
                  'flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition',
                  selected
                    ? 'border-navy bg-navy text-mist'
                    : 'border-navy/10 bg-surface text-navy hover:border-navy/40',
                  !selected && count === 0 && 'cursor-not-allowed opacity-40',
                )}
              >
                <span>{item.name}</span>
                <span className="text-[10px] font-medium opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <PriceRange filters={filters} onUpdate={onUpdate} />

      <button
        type="button"
        role="switch"
        aria-checked={filters.inStock}
        onClick={() => onUpdate({ inStock: !filters.inStock })}
        className="flex min-h-11 w-full items-center justify-between rounded-xl border border-navy/10 bg-surface px-3 py-2 text-left text-xs font-semibold"
      >
        <span>Solo disponibles</span>
        <span
          className={cn(
            'relative h-6 w-11 rounded-full transition',
            filters.inStock ? 'bg-turquoise' : 'bg-navy/15',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition',
              filters.inStock ? 'left-[22px]' : 'left-0.5',
            )}
          />
        </span>
      </button>

      <button
        type="button"
        onClick={onClear}
        className="w-full rounded-xl border border-navy/10 px-3 py-2.5 text-xs font-semibold text-navy/60 transition hover:border-navy/30 hover:text-navy"
      >
        Limpiar filtros
      </button>
    </div>
  )
}
