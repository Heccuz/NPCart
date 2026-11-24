import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Product, ProductSort } from '@/domain/entities'
import { formatCents } from '@/domain/money'
import { adminGateway } from '@/infrastructure/http/admin-gateway'
import { apiErrorMessage } from '@/infrastructure/http/client'
import ImageWithFallback from '@/presentation/components/ImageWithFallback'
import Modal from '@/presentation/components/admin/Modal'
import { useDebounce } from '@/presentation/hooks/useDebounce'
import { useCategories, useSeries } from '@/presentation/hooks/useProducts'
import { cn } from '@/presentation/lib/cn'

const PAGE_SIZE = 50

type SortKey = 'name' | 'size' | 'price' | 'stock' | 'status'
type SortDirection = 'asc' | 'desc'

const SORT_KEYS: Record<SortKey, { asc: ProductSort; desc: ProductSort }> = {
  name: { asc: 'name_asc', desc: 'name_desc' },
  size: { asc: 'size_asc', desc: 'size_desc' },
  price: { asc: 'price_asc', desc: 'price_desc' },
  stock: { asc: 'stock_asc', desc: 'stock_desc' },
  status: { asc: 'status_asc', desc: 'status_desc' },
}

function activeSortOf(sort: ProductSort): { key: SortKey; direction: SortDirection } | null {
  for (const key of Object.keys(SORT_KEYS) as SortKey[]) {
    if (sort === SORT_KEYS[key].asc) return { key, direction: 'asc' }
    if (sort === SORT_KEYS[key].desc) return { key, direction: 'desc' }
  }
  return null
}

function SortableHeader({
  label,
  sortKey,
  activeSort,
  onSort,
}: {
  label: string
  sortKey: SortKey
  activeSort: { key: SortKey; direction: SortDirection } | null
  onSort: (key: SortKey) => void
}) {
  const active = activeSort?.key === sortKey
  const direction = activeSort?.direction ?? 'asc'
  return (
    <th
      className="px-4 py-3 font-semibold"
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-navy',
          active && 'text-navy',
        )}
      >
        {label}
        <span aria-hidden="true" className="text-[9px]">
          {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  )
}

interface FormState {
  name: string
  categoryId: string
  seriesIds: string[]
  primarySeriesId: string
  price: string
  stock: string
  details: string
  imageUrl: string
  isActive: boolean
  isFeatured: boolean
}

function initialForm(product: Product | null): FormState {
  return {
    name: product?.name ?? '',
    categoryId: product?.categoryId ?? '',
    seriesIds: product?.series.map((item) => item.id) ?? [],
    primarySeriesId: product?.primarySeriesId ?? '',
    price: product ? (product.priceCents / 100).toFixed(2) : '',
    stock: product ? String(product.stock) : '0',
    details: product?.details ?? '',
    imageUrl: product?.imageUrl ?? '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
  }
}

function ProductForm({ product, onSaved }: { product: Product | null; onSaved: () => void }) {
  const { data: categories = [] } = useCategories()
  const { data: series = [] } = useSeries()
  const [form, setForm] = useState<FormState>(() => initialForm(product))
  const [priceTouched, setPriceTouched] = useState(Boolean(product))
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      const priceCents = Math.round(Number(form.price) * 100)
      const input = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        primarySeriesId: form.primarySeriesId,
        seriesIds: form.seriesIds,
        priceCents,
        imageUrl: form.imageUrl.trim(),
        details: form.details.trim(),
        stock: Number(form.stock),
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      }
      return product
        ? adminGateway.updateProduct(product.id, input)
        : adminGateway.createProduct(input)
    },
    onSuccess: onSaved,
    onError: (mutationError) => setError(apiErrorMessage(mutationError)),
  })

  const toggleSeries = (seriesId: string) => {
    setForm((previous) => {
      const selected = previous.seriesIds.includes(seriesId)
        ? previous.seriesIds.filter((id) => id !== seriesId)
        : [...previous.seriesIds, seriesId]
      const primary = selected.includes(previous.primarySeriesId)
        ? previous.primarySeriesId
        : (selected[0] ?? '')
      return { ...previous, seriesIds: selected, primarySeriesId: primary }
    })
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (form.name.trim().length < 2) return setError('El nombre debe tener al menos 2 caracteres')
    if (!form.categoryId) return setError('Elige un tamaño')
    if (form.seriesIds.length === 0) return setError('Elige al menos una serie')
    if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0) {
      return setError('El precio debe ser mayor que cero')
    }
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) {
      return setError('El stock debe ser un entero mayor o igual a cero')
    }
    mutation.mutate()
  }

  const onCategoryChange = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId)
    setForm((previous) => ({
      ...previous,
      categoryId,
      price:
        !priceTouched || !previous.price
          ? category
            ? (category.basePriceCents / 100).toFixed(2)
            : previous.price
          : previous.price,
    }))
  }

  return (
    <form id="product-form" onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="product-name">
          Nombre
        </label>
        <input
          id="product-name"
          className="input"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Spiderman Clásico"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="product-category">
            Tamaño
          </label>
          <select
            id="product-category"
            className="input"
            value={form.categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="">Elegir…</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} · {formatCents(category.basePriceCents)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="product-price">
            Precio (S/)
          </label>
          <input
            id="product-price"
            className="input"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={form.price}
            onChange={(event) => {
              setPriceTouched(true)
              setForm({ ...form, price: event.target.value })
            }}
          />
        </div>
      </div>

      <div>
        <p className="label">Series</p>
        <div className="flex flex-wrap gap-2">
          {series.map((item) => {
            const selected = form.seriesIds.includes(item.id)
            const isPrimary = form.primarySeriesId === item.id
            return (
              <span
                key={item.id}
                className={cn(
                  'inline-flex items-center rounded-full border text-[11px] font-semibold',
                  selected
                    ? 'border-brand bg-brand text-brand-ink'
                    : 'border-navy/15 bg-surface text-navy/70',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleSeries(item.id)}
                  className="py-1.5 pl-3 pr-1.5"
                >
                  {item.name}
                </button>
                {selected && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, primarySeriesId: item.id })}
                    aria-label={`Marcar ${item.name} como serie principal`}
                    title={isPrimary ? 'Serie principal' : 'Marcar como principal'}
                    className={cn(
                      'py-1.5 pl-0.5 pr-2.5 text-sm',
                      isPrimary ? 'text-turquoise' : 'text-brand-ink/65',
                    )}
                  >
                    {isPrimary ? '★' : '☆'}
                  </button>
                )}
              </span>
            )
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-navy/60">
          La estrella marca la serie principal que se muestra en la tarjeta.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="product-stock">
            Stock
          </label>
          <input
            id="product-stock"
            className="input"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={form.stock}
            onChange={(event) => setForm({ ...form, stock: event.target.value })}
          />
        </div>
        <div className="flex items-end gap-4 pb-1 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
            />
            Activo
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })}
            />
            Destacado
          </label>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="product-image">
          URL de imagen (Google Drive)
        </label>
        <div className="flex gap-3">
          <ImageWithFallback
            src={form.imageUrl}
            alt="Vista previa"
            className="h-20 w-20 shrink-0 rounded-xl"
          />
          <input
            id="product-image"
            className="input self-start"
            value={form.imageUrl}
            onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
            placeholder="https://drive.google.com/file/d/…/view"
          />
        </div>
        <p className="mt-1 text-[11px] text-navy/60">
          Comparte el archivo como “cualquiera con el link”. La URL se normaliza sola.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="product-details">
          Detalles
        </label>
        <textarea
          id="product-details"
          className="input min-h-24"
          value={form.details}
          onChange={(event) => setForm({ ...form, details: event.target.value })}
          placeholder="Material, acabado, base incluida…"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-turquoise/10 px-3 py-2 text-xs text-violet" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={mutation.isPending} className="btn-primary h-11 w-full">
        {mutation.isPending ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
      </button>
    </form>
  )
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const debouncedQ = useDebounce(q, 300)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<ProductSort>('default')
  const [showArchived, setShowArchived] = useState(false)
  const [notice, setNotice] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  const activeSort = useMemo(() => activeSortOf(sort), [sort])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'products', debouncedQ, page, sort],
    queryFn: () => adminGateway.listProducts({ q: debouncedQ, page, pageSize: PAGE_SIZE, sort }),
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedQ])

  const toggleSort = (key: SortKey) => {
    setSort((current) => {
      if (current === SORT_KEYS[key].asc) return SORT_KEYS[key].desc
      if (current === SORT_KEYS[key].desc) return 'default'
      return SORT_KEYS[key].asc
    })
    setPage(1)
  }

  const products = useMemo(
    () => (data?.items ?? []).filter((product) => showArchived || !product.deletedAt),
    [data?.items, showArchived],
  )

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminGateway.setProductActive(id, isActive),
    onSuccess: invalidate,
    onError: (error) => setNotice(apiErrorMessage(error)),
  })

  const toggleFeatured = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      adminGateway.setProductFeatured(id, isFeatured),
    onSuccess: invalidate,
    onError: (error) => setNotice(apiErrorMessage(error)),
  })

  const archive = useMutation({
    mutationFn: (id: string) => adminGateway.archiveProduct(id),
    onSuccess: () => {
      setNotice('Producto archivado. Puedes restaurarlo desde "Mostrar archivados".')
      invalidate()
    },
    onError: (error) => setNotice(apiErrorMessage(error)),
  })

  const restore = useMutation({
    mutationFn: (id: string) => adminGateway.restoreProduct(id),
    onSuccess: () => {
      setNotice('Producto restaurado.')
      invalidate()
    },
    onError: (error) => setNotice(apiErrorMessage(error)),
  })

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setFormOpen(true)
  }

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl">Productos</h1>
        </div>
        <button type="button" onClick={openNew} className="btn-primary h-11">
          + Nuevo producto
        </button>
      </div>

      {notice && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-navy/10 bg-surface px-4 py-3 text-sm">
          <p className="text-navy/70">{notice}</p>
          <button type="button" onClick={() => setNotice('')} className="text-navy/60">
            ✕
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="input h-11 sm:max-w-sm"
          placeholder="Buscar producto…"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <label className="flex items-center gap-2 text-xs font-medium text-navy/60">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
          />
          Mostrar archivados
        </label>
      </div>

      {isError ? (
        <div className="card mt-6 px-5 py-10 text-center text-sm">
          <p className="text-navy/60">No pudimos cargar los productos.</p>
          <button type="button" onClick={() => refetch()} className="btn-ghost mt-3 h-10">
            Reintentar
          </button>
        </div>
      ) : isLoading ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-haze" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card mt-6 px-5 py-10 text-center text-sm text-navy/60">
          No hay productos que coincidan.
        </div>
      ) : (
        <>
          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-navy/10 bg-surface md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-navy/10 bg-navy/5 text-left text-[11px] uppercase tracking-wider text-navy/60">
                <tr>
                  <SortableHeader
                    label="Producto"
                    sortKey="name"
                    activeSort={activeSort}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Tamaño"
                    sortKey="size"
                    activeSort={activeSort}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Precio"
                    sortKey="price"
                    activeSort={activeSort}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Stock"
                    sortKey="stock"
                    activeSort={activeSort}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Estado"
                    sortKey="status"
                    activeSort={activeSort}
                    onSort={toggleSort}
                  />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {products.map((product) => (
                  <tr key={product.id} className={cn(product.deletedAt && 'bg-navy/[0.03]')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-10 w-10 shrink-0 rounded-lg"
                          hideLabel
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="truncate text-[11px] text-navy/60">
                            {product.primarySeries.name}
                            {product.deletedAt && ' · archivado'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-navy/60">{product.category.name}</td>
                    <td className="px-4 py-3">{formatCents(product.priceCents)}</td>
                    <td className="px-4 py-3">
                      <span className={cn(product.stock === 0 && 'text-violet')}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          disabled={Boolean(product.deletedAt)}
                          onClick={() =>
                            toggleActive.mutate({ id: product.id, isActive: !product.isActive })
                          }
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                            product.isActive
                              ? 'border-turquoise/40 bg-turquoise/10 text-turquoise-ink'
                              : 'border-navy/15 text-navy/60',
                          )}
                        >
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(product.deletedAt)}
                          onClick={() =>
                            toggleFeatured.mutate({
                              id: product.id,
                              isFeatured: !product.isFeatured,
                            })
                          }
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                            product.isFeatured
                              ? 'border-violet/40 bg-violet/10 text-violet'
                              : 'border-navy/15 text-navy/60',
                          )}
                        >
                          {product.isFeatured ? '★ Destacado' : 'Destacar'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 text-xs font-semibold">
                        {product.deletedAt ? (
                          <button
                            type="button"
                            onClick={() => restore.mutate(product.id)}
                            className="text-turquoise-ink hover:underline"
                          >
                            Restaurar
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(product)}
                              className="text-navy/60 hover:text-navy"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Archivar "${product.name}"?`)) {
                                  archive.mutate(product.id)
                                }
                              }}
                              className="text-violet hover:underline"
                            >
                              Archivar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-5 space-y-2 md:hidden">
            {products.map((product) => (
              <li
                key={product.id}
                className={cn(
                  'rounded-2xl border border-navy/10 bg-surface p-3',
                  product.deletedAt && 'opacity-60',
                )}
              >
                <div className="flex gap-3">
                  <ImageWithFallback
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-14 w-14 shrink-0 rounded-xl"
                    hideLabel
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm">{product.name}</p>
                    <p className="text-[11px] text-navy/60">
                      {product.category.name} · {product.primarySeries.name}
                    </p>
                    <p className="mt-1 text-sm">
                      {formatCents(product.priceCents)} · {product.stock} u.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={Boolean(product.deletedAt)}
                    onClick={() =>
                      toggleActive.mutate({ id: product.id, isActive: !product.isActive })
                    }
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                      product.isActive
                        ? 'border-turquoise/40 bg-turquoise/10 text-turquoise-ink'
                        : 'border-navy/15 text-navy/60',
                    )}
                  >
                    {product.isActive ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(product.deletedAt)}
                    onClick={() =>
                      toggleFeatured.mutate({ id: product.id, isFeatured: !product.isFeatured })
                    }
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                      product.isFeatured
                        ? 'border-violet/40 bg-violet/10 text-violet'
                        : 'border-navy/15 text-navy/60',
                    )}
                  >
                    {product.isFeatured ? '★ Destacado' : 'Destacar'}
                  </button>
                  <span className="flex-1" />
                  {product.deletedAt ? (
                    <button
                      type="button"
                      onClick={() => restore.mutate(product.id)}
                      className="text-xs font-semibold text-turquoise-ink"
                    >
                      Restaurar
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="text-xs font-semibold text-navy/60"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Archivar "${product.name}"?`)) {
                            archive.mutate(product.id)
                          }
                        }}
                        className="text-xs font-semibold text-violet"
                      >
                        Archivar
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="btn-ghost h-10 px-4"
              >
                Anterior
              </button>
              <span className="text-navy/60">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="btn-ghost h-10 px-4"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {formOpen && (
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editing ? `Editar ${editing.name}` : 'Nuevo producto'}
          wide
        >
          <ProductForm
            product={editing}
            onSaved={() => {
              invalidate()
              setFormOpen(false)
              setNotice(editing ? 'Producto actualizado.' : 'Producto creado.')
            }}
          />
        </Modal>
      )}
    </div>
  )
}
