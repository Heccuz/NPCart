import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Product } from '@/domain/entities'
import { formatCents } from '@/domain/money'
import { adminGateway } from '@/infrastructure/http/admin-gateway'
import { apiErrorMessage } from '@/infrastructure/http/client'
import ImageWithFallback from '@/presentation/components/ImageWithFallback'
import Modal from '@/presentation/components/admin/Modal'
import { useDebounce } from '@/presentation/hooks/useDebounce'
import { useCategories, useSeries } from '@/presentation/hooks/useProducts'
import { cn } from '@/presentation/lib/cn'

const PAGE_SIZE = 50

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

function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null
  onClose: () => void
  onSaved: () => void
}) {
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
                    ? 'border-ink bg-ink text-bone'
                    : 'border-ink/15 bg-white/60 text-ink/70',
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
                    className={cn('py-1.5 pl-0.5 pr-2.5 text-sm', isPrimary ? 'text-ember' : 'text-bone/65')}
                  >
                    {isPrimary ? '★' : '☆'}
                  </button>
                )}
              </span>
            )
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-ink/60">
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
        <p className="mt-1 text-[11px] text-ink/60">
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
        <p className="rounded-xl bg-ember/10 px-3 py-2 text-xs text-ember" role="alert">
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
  const [showArchived, setShowArchived] = useState(false)
  const [notice, setNotice] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'products', debouncedQ, page],
    queryFn: () => adminGateway.listProducts({ q: debouncedQ, page, pageSize: PAGE_SIZE }),
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedQ])

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
          <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Productos</h1>
        </div>
        <button type="button" onClick={openNew} className="btn-primary h-11">
          + Nuevo producto
        </button>
      </div>

      {notice && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-ink/10 bg-white/70 px-4 py-3 text-sm">
          <p className="text-ink/70">{notice}</p>
          <button type="button" onClick={() => setNotice('')} className="text-ink/60">
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
        <label className="flex items-center gap-2 text-xs font-medium text-ink/60">
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
          <p className="text-ink/60">No pudimos cargar los productos.</p>
          <button type="button" onClick={() => refetch()} className="btn-ghost mt-3 h-10">
            Reintentar
          </button>
        </div>
      ) : isLoading ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-sand" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card mt-6 px-5 py-10 text-center text-sm text-ink/60">
          No hay productos que coincidan.
        </div>
      ) : (
        <>
          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-ink/10 bg-white/60 md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 bg-ink/5 text-left text-[11px] uppercase tracking-wider text-ink/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Tamaño</th>
                  <th className="px-4 py-3 font-semibold">Precio</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {products.map((product) => (
                  <tr key={product.id} className={cn(product.deletedAt && 'bg-ink/[0.03]')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-10 w-10 shrink-0 rounded-lg" hideLabel
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="truncate text-[11px] text-ink/60">
                            {product.primarySeries.name}
                            {product.deletedAt && ' · archivado'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink/60">{product.category.name}</td>
                    <td className="px-4 py-3">{formatCents(product.priceCents)}</td>
                    <td className="px-4 py-3">
                      <span className={cn(product.stock === 0 && 'text-ember')}>
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
                              ? 'border-moss/40 bg-moss/10 text-moss'
                              : 'border-ink/15 text-ink/60',
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
                              ? 'border-ember/40 bg-ember/10 text-ember'
                              : 'border-ink/15 text-ink/60',
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
                            className="text-moss hover:underline"
                          >
                            Restaurar
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(product)}
                              className="text-ink/60 hover:text-ink"
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
                              className="text-ember hover:underline"
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
                  'rounded-2xl border border-ink/10 bg-white/60 p-3',
                  product.deletedAt && 'opacity-60',
                )}
              >
                <div className="flex gap-3">
                  <ImageWithFallback
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-14 w-14 shrink-0 rounded-xl" hideLabel
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold">{product.name}</p>
                    <p className="text-[11px] text-ink/60">
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
                        ? 'border-moss/40 bg-moss/10 text-moss'
                        : 'border-ink/15 text-ink/60',
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
                        ? 'border-ember/40 bg-ember/10 text-ember'
                        : 'border-ink/15 text-ink/60',
                    )}
                  >
                    {product.isFeatured ? '★ Destacado' : 'Destacar'}
                  </button>
                  <span className="flex-1" />
                  {product.deletedAt ? (
                    <button
                      type="button"
                      onClick={() => restore.mutate(product.id)}
                      className="text-xs font-semibold text-moss"
                    >
                      Restaurar
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="text-xs font-semibold text-ink/60"
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
                        className="text-xs font-semibold text-ember"
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
              <span className="text-ink/60">
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
            onClose={() => setFormOpen(false)}
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
