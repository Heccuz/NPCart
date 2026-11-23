import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ProductSort } from '@/domain/entities'

export interface CatalogFilters {
  categories: string[]
  series: string[]
  q: string
  minPriceCents?: number
  maxPriceCents?: number
  inStock: boolean
  sort: ProductSort
  page: number
}

export const PAGE_SIZE = 12

const SORTS: ProductSort[] = ['default', 'price_asc', 'price_desc', 'newest']

const DEFAULTS: CatalogFilters = {
  categories: [],
  series: [],
  q: '',
  inStock: false,
  sort: 'default',
  page: 1,
}

function parseFilters(params: URLSearchParams): CatalogFilters {
  const list = (key: string) =>
    (params.get(key) ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

  const number = (key: string) => {
    const raw = params.get(key)
    if (!raw) return undefined
    const value = Number(raw)
    return Number.isFinite(value) && value >= 0 ? value : undefined
  }

  const sort = params.get('sort') as ProductSort | null

  return {
    categories: list('categorias'),
    series: list('series'),
    q: params.get('q') ?? '',
    minPriceCents: number('min'),
    maxPriceCents: number('max'),
    inStock: params.get('stock') === '1',
    sort: sort && SORTS.includes(sort) ? sort : 'default',
    page: number('page') ?? 1,
  }
}

function toSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.categories.length) params.set('categorias', filters.categories.join(','))
  if (filters.series.length) params.set('series', filters.series.join(','))
  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.minPriceCents != null) params.set('min', String(filters.minPriceCents))
  if (filters.maxPriceCents != null) params.set('max', String(filters.maxPriceCents))
  if (filters.inStock) params.set('stock', '1')
  if (filters.sort !== 'default') params.set('sort', filters.sort)
  if (filters.page > 1) params.set('page', String(filters.page))
  return params
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]
}

export function parseCatalogFilters(params: URLSearchParams): CatalogFilters {
  return parseFilters(params)
}

/** Filtros del catálogo con la URL como fuente de verdad (compartible). */
export function useCatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const apply = useCallback(
    (next: CatalogFilters) => {
      setSearchParams(toSearchParams(next), { replace: true })
    },
    [setSearchParams],
  )

  const update = useCallback(
    (patch: Partial<CatalogFilters>) => {
      apply({ ...filters, page: 1, ...patch })
    },
    [apply, filters],
  )

  return {
    filters,
    update,
    setPage: (page: number) => apply({ ...filters, page: Math.max(1, page) }),
    toggleCategory: (slug: string) =>
      update({ categories: toggleValue(filters.categories, slug) }),
    toggleSeries: (slug: string) => update({ series: toggleValue(filters.series, slug) }),
    clear: () => apply({ ...DEFAULTS }),
    hasActiveFilters:
      filters.categories.length > 0 ||
      filters.series.length > 0 ||
      filters.q.trim().length > 0 ||
      filters.minPriceCents != null ||
      filters.maxPriceCents != null ||
      filters.inStock,
  }
}

export const SORT_OPTIONS: Array<{ value: ProductSort; label: string }> = [
  { value: 'default', label: 'Destacados' },
  { value: 'newest', label: 'Novedades' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
]
