import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Series } from '@/domain/entities'
import { adminGateway } from '@/infrastructure/http/admin-gateway'
import { apiErrorMessage } from '@/infrastructure/http/client'
import ImageWithFallback from '@/presentation/components/ImageWithFallback'
import Modal from '@/presentation/components/admin/Modal'
import { cn } from '@/presentation/lib/cn'

function SeriesForm({ series, onSaved }: { series: Series | null; onSaved: () => void }) {
  const [name, setName] = useState(series?.name ?? '')
  const [slug, setSlug] = useState(series?.slug ?? '')
  const [imageUrl, setImageUrl] = useState(series?.imageUrl ?? '')
  const [sortOrder, setSortOrder] = useState(series ? String(series.sortOrder) : '0')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        imageUrl: imageUrl.trim() || null,
        sortOrder: Number(sortOrder),
      }
      return series
        ? adminGateway.updateSeries(series.id, input)
        : adminGateway.createSeries(input)
    },
    onSuccess: onSaved,
    onError: (mutationError) => setError(apiErrorMessage(mutationError)),
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (name.trim().length < 2) return setError('El nombre debe tener al menos 2 caracteres')
    mutation.mutate()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="series-name">
          Nombre
        </label>
        <input
          id="series-name"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Dungeons & Dragons"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="series-slug">
            Slug (opcional)
          </label>
          <input
            id="series-slug"
            className="input"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="dungeons-dragons"
          />
        </div>
        <div>
          <label className="label" htmlFor="series-order">
            Orden
          </label>
          <input
            id="series-order"
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
        <label className="label" htmlFor="series-image">
          Imagen de portada (Google Drive)
        </label>
        <div className="flex gap-3">
          <ImageWithFallback
            src={imageUrl}
            alt="Vista previa"
            className="h-20 w-20 shrink-0 rounded-xl"
          />
          <input
            id="series-image"
            className="input self-start"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://drive.google.com/file/d/…/view"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-ember/10 px-3 py-2 text-xs text-ember" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={mutation.isPending} className="btn-primary h-11 w-full">
        {mutation.isPending ? 'Guardando…' : series ? 'Guardar cambios' : 'Crear serie'}
      </button>
    </form>
  )
}

export default function AdminSeriesPage() {
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Series | null>(null)

  const { data: series = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'series'],
    queryFn: () => adminGateway.listSeries(),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'series'] })
    queryClient.invalidateQueries({ queryKey: ['series'] })
  }

  const archive = useMutation({
    mutationFn: (id: string) => adminGateway.archiveSeries(id),
    onSuccess: () => {
      setNotice('Serie archivada.')
      invalidate()
    },
    onError: (error) => setNotice(apiErrorMessage(error)),
  })

  const restore = useMutation({
    mutationFn: (id: string) => adminGateway.restoreSeries(id),
    onSuccess: () => {
      setNotice('Serie restaurada.')
      invalidate()
    },
    onError: (error) => setNotice(apiErrorMessage(error)),
  })

  const visible = series.filter((item) => showArchived || !item.deletedAt)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Series</h1>
          <p className="mt-1 text-xs text-ink/60">Temáticas que agrupan las minis.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          className="btn-primary h-11"
        >
          + Nueva serie
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
          <p className="text-ink/60">No pudimos cargar las series.</p>
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
          {visible.map((item) => (
            <li
              key={item.id}
              className={cn(
                'flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/60 px-3 py-2.5',
                item.deletedAt && 'opacity-60',
              )}
            >
              <ImageWithFallback
                src={item.imageUrl}
                alt={item.name}
                className="h-12 w-12 shrink-0 rounded-xl" hideLabel
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold">
                  {item.name}
                  {item.deletedAt && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-ink/60">
                      archivada
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-ink/60">
                  /{item.slug} · orden {item.sortOrder}
                </p>
              </div>
              <div className="flex gap-3 text-xs font-semibold">
                {item.deletedAt ? (
                  <button type="button" onClick={() => restore.mutate(item.id)} className="text-moss">
                    Restaurar
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(item)
                        setFormOpen(true)
                      }}
                      className="text-ink/60 hover:text-ink"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Archivar "${item.name}"?`)) {
                          archive.mutate(item.id)
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
          title={editing ? `Editar ${editing.name}` : 'Nueva serie'}
        >
          <SeriesForm
            series={editing}
            onSaved={() => {
              invalidate()
              setFormOpen(false)
              setNotice(editing ? 'Serie actualizada.' : 'Serie creada.')
            }}
          />
        </Modal>
      )}
    </div>
  )
}
