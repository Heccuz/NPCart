import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Category, CategoryOffer } from '@/domain/entities'
import { formatCents } from '@/domain/money'
import { adminGateway } from '@/infrastructure/http/admin-gateway'
import { apiErrorMessage } from '@/infrastructure/http/client'
import Modal from '@/presentation/components/admin/Modal'
import { useCategories } from '@/presentation/hooks/useProducts'
import { cn } from '@/presentation/lib/cn'

function OfferForm({
  offer,
  categories,
  onSaved,
}: {
  offer: CategoryOffer | null
  categories: Category[]
  onSaved: () => void
}) {
  const [categoryId, setCategoryId] = useState(offer?.categoryId ?? '')
  const [minQuantity, setMinQuantity] = useState(offer ? String(offer.minQuantity) : '')
  const [price, setPrice] = useState(offer ? (offer.unitPriceCents / 100).toFixed(2) : '')
  const [isActive, setIsActive] = useState(offer?.isActive ?? true)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        categoryId,
        minQuantity: Number(minQuantity),
        unitPriceCents: Math.round(Number(price) * 100),
        isActive,
      }
      return offer ? adminGateway.updateOffer(offer.id, input) : adminGateway.createOffer(input)
    },
    onSuccess: onSaved,
    onError: (mutationError) => setError(apiErrorMessage(mutationError)),
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!categoryId) return setError('Elige una categoría')
    if (!Number.isInteger(Number(minQuantity)) || Number(minQuantity) < 1) {
      return setError('La cantidad mínima debe ser un entero mayor o igual a 1')
    }
    if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
      return setError('El precio de oferta debe ser mayor que cero')
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="offer-category">
          Categoría
        </label>
        <select
          id="offer-category"
          className="input"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">Elegir…</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="offer-min">
            Desde (unidades)
          </label>
          <input
            id="offer-min"
            className="input"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={minQuantity}
            onChange={(event) => setMinQuantity(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="offer-price">
            Precio unitario (S/)
          </label>
          <input
            id="offer-price"
            className="input"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />
        Oferta activa
      </label>

      <p className="rounded-xl bg-ink/5 px-3 py-2 text-[11px] leading-relaxed text-ink/50">
        Los tramos de una categoría deben tener cantidades distintas y precios estrictamente
        decrecientes: 5+ a S/ 12, 10+ a S/ 10.
      </p>

      {error && (
        <p className="rounded-xl bg-ember/10 px-3 py-2 text-xs text-ember" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={mutation.isPending} className="btn-primary h-11 w-full">
        {mutation.isPending ? 'Guardando…' : offer ? 'Guardar cambios' : 'Crear oferta'}
      </button>
    </form>
  )
}

export default function AdminOffersPage() {
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryOffer | null>(null)

  const { data: categories = [] } = useCategories()
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['admin', 'offers'],
    queryFn: () => adminGateway.listOffers(),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] })
    queryClient.invalidateQueries({ queryKey: ['offers'] })
  }

  const archive = useMutation({
    mutationFn: (id: string) => adminGateway.archiveOffer(id),
    onSuccess: () => {
      setNotice('Oferta archivada.')
      invalidate()
    },
    onError: (error) => setNotice(apiErrorMessage(error)),
  })

  const restore = useMutation({
    mutationFn: (id: string) => adminGateway.restoreOffer(id),
    onSuccess: () => {
      setNotice('Oferta restaurada.')
      invalidate()
    },
    onError: (error) => setNotice(apiErrorMessage(error)),
  })

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; offers: CategoryOffer[] }>()
    for (const offer of offers) {
      if (!showArchived && offer.deletedAt) continue
      if (!map.has(offer.categoryId)) {
        map.set(offer.categoryId, { name: offer.category.name, offers: [] })
      }
      map.get(offer.categoryId)!.offers.push(offer)
    }
    for (const group of map.values()) {
      group.offers.sort((a, b) => a.minQuantity - b.minQuantity)
    }
    return [...map.values()]
  }, [offers, showArchived])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Ofertas</h1>
          <p className="mt-1 text-xs text-ink/50">
            Tramos por cantidad, agrupados por tamaño. Se suman todas las series.
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
          + Nueva oferta
        </button>
      </div>

      {notice && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-ink/10 bg-white/70 px-4 py-3 text-sm">
          <p className="text-ink/70">{notice}</p>
          <button type="button" onClick={() => setNotice('')} className="text-ink/40">
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

      {isLoading ? (
        <div className="mt-5 space-y-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-sand" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card mt-5 px-5 py-10 text-center text-sm text-ink/50">
          Todavía no hay ofertas.
        </div>
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {groups.map((group) => (
            <section key={group.name} className="card p-4">
              <h2 className="font-display text-base font-semibold">{group.name}</h2>
              <ul className="mt-2 divide-y divide-ink/5">
                {group.offers.map((offer) => (
                  <li
                    key={offer.id}
                    className={cn(
                      'flex flex-wrap items-center gap-3 py-2.5 text-sm',
                      offer.deletedAt && 'opacity-50',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">Lleva {offer.minQuantity}+</span>
                      <span className="text-ink/40"> → </span>
                      <span className="font-semibold">{formatCents(offer.unitPriceCents)}</span>
                      <span className="text-xs text-ink/40"> c/u</span>
                    </span>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                        offer.isActive
                          ? 'border-moss/40 bg-moss/10 text-moss'
                          : 'border-ink/15 text-ink/40',
                      )}
                    >
                      {offer.isActive ? 'activa' : 'inactiva'}
                    </span>
                    <span className="flex gap-3 text-xs font-semibold">
                      {offer.deletedAt ? (
                        <button
                          type="button"
                          onClick={() => restore.mutate(offer.id)}
                          className="text-moss"
                        >
                          Restaurar
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(offer)
                              setFormOpen(true)
                            }}
                            className="text-ink/60 hover:text-ink"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Archivar el tramo ${offer.minQuantity}+?`)) {
                                archive.mutate(offer.id)
                              }
                            }}
                            className="text-ember"
                          >
                            Archivar
                          </button>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {formOpen && (
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editing ? 'Editar oferta' : 'Nueva oferta'}
        >
          <OfferForm
            offer={editing}
            categories={categories}
            onSaved={() => {
              invalidate()
              setFormOpen(false)
              setNotice(editing ? 'Oferta actualizada.' : 'Oferta creada.')
            }}
          />
        </Modal>
      )}
    </div>
  )
}
