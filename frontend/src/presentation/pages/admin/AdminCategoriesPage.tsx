import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Category } from '@/domain/entities'
import { formatCents } from '@/domain/money'
import { adminGateway } from '@/infrastructure/http/admin-gateway'
import { apiErrorMessage } from '@/infrastructure/http/client'
import Modal from '@/presentation/components/admin/Modal'
import { cn } from '@/presentation/lib/cn'

function CategoryForm({ category, onSaved }: { category: Category | null; onSaved: () => void }) {
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [basePrice, setBasePrice] = useState(
    category ? (category.basePriceCents / 100).toFixed(2) : '',
  )
  const [sortOrder, setSortOrder] = useState(category ? String(category.sortOrder) : '0')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        basePriceCents: Math.round(Number(basePrice) * 100),
        sortOrder: Number(sortOrder),
      }
      return category
        ? adminGateway.updateCategory(category.id, input)
        : adminGateway.createCategory(input)
    },
    onSuccess: onSaved,
    onError: (mutationError) => setError(apiErrorMessage(mutationError)),
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (name.trim().length < 2) return setError('El nombre debe tener al menos 2 caracteres')
    if (!Number.isFinite(Number(basePrice)) || Number(basePrice) < 0) {
      return setError('El precio base no es válido')
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="category-name">
          Nombre
        </label>
        <input
          id="category-name"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Mini mediana"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="category-price">
            Precio base (S/)
          </label>
          <input
            id="category-price"
            className="input"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={basePrice}
            onChange={(event) => setBasePrice(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="category-order">
            Orden
          </label>
          <input
            id="category-order"
            className="input"
            type="number"
            min={0}
            step={1}
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="category-slug">
          Slug (opcional)
        </label>
        <input
          id="category-slug"
          className="input"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="mini-mediana"
        />
        <p className="mt-1 text-[11px] text-ink/60">
          Se genera del nombre si lo dejas vacío. Se usa en la URL del catálogo.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-ember/10 px-3 py-2 text-xs text-ember" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={mutation.isPending} className="btn-primary h-11 w-full">
        {mutation.isPending ? 'Guardando…' : category ? 'Guardar cambios' : 'Crear categoría'}
      </button>
    </form>
  )
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const { data: categories = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminGateway.listCategories(),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }

  const archive = useMutation({
    mutationFn: (id: string) => adminGateway.archiveCategory(id),
    onSuccess: () => {
      setNotice('Categoría archivada.')
      invalidate()
    },
    onError: (error) => setNotice(apiErrorMessage(error)),
  })

  const restore = useMutation({
    mutationFn: (id: string) => adminGateway.restoreCategory(id),
    onSuccess: () => {
      setNotice('Categoría restaurada.')
      invalidate()
    },
    onError: (error) => setNotice(apiErrorMessage(error)),
  })

  const visible = categories.filter((category) => showArchived || !category.deletedAt)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Categorías</h1>
          <p className="mt-1 text-xs text-ink/60">
            Tamaños de mini. Definen el precio base y las ofertas por cantidad.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          className="btn-primary h-11"
        >
          + Nueva categoría
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

      <label className="mt-4 flex items-center gap-2 text-xs font-medium text-ink/60">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(event) => setShowArchived(event.target.checked)}
        />
        Mostrar archivadas
      </label>

      {isError ? (
        <div className="card mt-5 px-5 py-10 text-center text-sm">
          <p className="text-ink/60">No pudimos cargar las categorías.</p>
          <button type="button" onClick={() => refetch()} className="btn-ghost mt-3 h-10">
            Reintentar
          </button>
        </div>
      ) : isLoading ? (
        <div className="mt-5 space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-sand" />
          ))}
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {visible.map((category) => (
            <li
              key={category.id}
              className={cn(
                'flex flex-wrap items-center gap-3 rounded-2xl border border-ink/10 bg-white/60 px-4 py-3',
                category.deletedAt && 'opacity-60',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold">
                  {category.name}
                  {category.deletedAt && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-ink/60">
                      archivada
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-ink/60">
                  /{category.slug} · orden {category.sortOrder}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatCents(category.basePriceCents)}</p>
              <div className="flex gap-3 text-xs font-semibold">
                {category.deletedAt ? (
                  <button
                    type="button"
                    onClick={() => restore.mutate(category.id)}
                    className="text-moss"
                  >
                    Restaurar
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(category)
                        setFormOpen(true)
                      }}
                      className="text-ink/60 hover:text-ink"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Archivar "${category.name}"?`)) {
                          archive.mutate(category.id)
                        }
                      }}
                      className="text-ember"
                    >
                      Archivar
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editing ? `Editar ${editing.name}` : 'Nueva categoría'}
        >
          <CategoryForm
            category={editing}
            onSaved={() => {
              invalidate()
              setFormOpen(false)
              setNotice(editing ? 'Categoría actualizada.' : 'Categoría creada.')
            }}
          />
        </Modal>
      )}
    </div>
  )
}
