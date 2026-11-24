import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Order, OrderStatus, StockWarning } from '@/domain/entities'
import { formatCents } from '@/domain/money'
import { adminGateway } from '@/infrastructure/http/admin-gateway'
import { apiErrorMessage } from '@/infrastructure/http/client'
import Modal from '@/presentation/components/admin/Modal'
import { useDebounce } from '@/presentation/hooks/useDebounce'
import { formatDateTime } from '@/presentation/lib/format-date'
import { cn } from '@/presentation/lib/cn'

const PAGE_SIZE = 20

function StatusPill({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    PENDIENTE: 'border-violet/40 bg-violet/10 text-violet',
    CONFIRMADO: 'border-turquoise/40 bg-turquoise/10 text-turquoise-ink',
    CANCELADO: 'border-navy/15 bg-navy/5 text-navy/60',
  }
  return (
    <span
      className={cn(
        'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        styles[status],
      )}
    >
      {status.toLowerCase()}
    </span>
  )
}

function statusLabel(status: OrderStatus) {
  return status === 'PENDIENTE'
    ? 'Pendiente'
    : status === 'CONFIRMADO'
      ? 'Confirmado'
      : 'Cancelado'
}

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const debouncedQ = useDebounce(q, 300)
  const [status, setStatus] = useState<'TODOS' | OrderStatus>('TODOS')
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [warnings, setWarnings] = useState<StockWarning[]>([])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'orders', debouncedQ, status, page],
    queryFn: () =>
      adminGateway.listOrders({
        q: debouncedQ,
        status: status === 'TODOS' ? undefined : status,
        page,
        pageSize: PAGE_SIZE,
      }),
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, status])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  const confirm = useMutation({
    mutationFn: (id: string) => adminGateway.confirmOrder(id),
    onSuccess: (result) => {
      setSelected(result.order)
      setWarnings(result.warnings)
      setNotice(
        result.warnings.length > 0
          ? 'Pedido confirmado con advertencias de stock.'
          : 'Pedido confirmado y stock descontado.',
      )
      invalidate()
    },
    onError: (error) => setNotice(apiErrorMessage(error)),
  })

  const cancel = useMutation({
    mutationFn: (id: string) => adminGateway.cancelOrder(id),
    onSuccess: (order) => {
      setSelected(order)
      setWarnings([])
      setNotice('Pedido cancelado. Si estaba confirmado, el stock fue devuelto.')
      invalidate()
    },
    onError: (error) => setNotice(apiErrorMessage(error)),
  })

  const orders = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))

  const openOrder = (order: Order) => {
    setSelected(order)
    setWarnings([])
  }

  return (
    <div>
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl">Pedidos</h1>
        <p className="mt-1 text-xs text-navy/60">
          Verifica el código que llega por WhatsApp y confirma la venta.
        </p>
      </div>

      {notice && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-navy/10 bg-white/70 px-4 py-3 text-sm">
          <p className="text-navy/70">{notice}</p>
          <button type="button" onClick={() => setNotice('')} className="text-navy/60">
            ✕
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          className="input h-11 sm:max-w-xs"
          placeholder="Buscar por código (NPC-…)"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <select
          className="input h-11 sm:max-w-44"
          value={status}
          onChange={(event) => setStatus(event.target.value as 'TODOS' | OrderStatus)}
        >
          <option value="TODOS">Todos</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="CONFIRMADO">Confirmados</option>
          <option value="CANCELADO">Cancelados</option>
        </select>
      </div>

      {isError ? (
        <div className="card mt-5 px-5 py-10 text-center text-sm">
          <p className="text-navy/60">No pudimos cargar los pedidos.</p>
          <button type="button" onClick={() => refetch()} className="btn-ghost mt-3 h-10">
            Reintentar
          </button>
        </div>
      ) : isLoading ? (
        <div className="mt-5 space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-haze" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card mt-5 px-5 py-10 text-center text-sm text-navy/60">
          No hay pedidos que coincidan.
        </div>
      ) : (
        <>
          <ul className="mt-5 space-y-2">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-navy/10 bg-white/60 px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm">{order.code}</p>
                  <p className="text-[11px] text-navy/60">
                    {formatDateTime(order.createdAt)} · {order.items.length} ítem(s)
                  </p>
                </div>
                <StatusPill status={order.status} />
                <p className="w-24 text-right font-semibold">{formatCents(order.totalCents)}</p>
                <button
                  type="button"
                  onClick={() => openOrder(order)}
                  className="text-xs font-semibold text-navy/60 hover:text-navy"
                >
                  Ver
                </button>
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

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Pedido ${selected.code}` : 'Pedido'}
        wide
        footer={
          selected && (
            <div className="flex flex-wrap gap-2">
              {selected.status === 'PENDIENTE' && (
                <button
                  type="button"
                  onClick={() => confirm.mutate(selected.id)}
                  disabled={confirm.isPending}
                  className="btn-accent h-11 flex-1"
                >
                  {confirm.isPending ? 'Confirmando…' : 'Confirmar pedido'}
                </button>
              )}
              {selected.status !== 'CANCELADO' && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Cancelar este pedido?')) cancel.mutate(selected.id)
                  }}
                  disabled={cancel.isPending}
                  className="btn-ghost h-11 flex-1"
                >
                  Cancelar pedido
                </button>
              )}
              {selected.status === 'CANCELADO' && (
                <p className="text-xs text-navy/60">Este pedido ya está cancelado.</p>
              )}
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <StatusPill status={selected.status} />
              <span className="text-navy/60">{formatDateTime(selected.createdAt)}</span>
              <span className="ml-auto font-semibold">{formatCents(selected.totalCents)}</span>
            </div>

            {warnings.length > 0 && (
              <div className="rounded-xl border border-violet/40 bg-violet/5 p-3 text-xs text-navy/70">
                <p className="font-semibold text-violet">Stock insuficiente al confirmar</p>
                <ul className="mt-1 space-y-0.5">
                  {warnings.map((warning) => (
                    <li key={warning.productId}>
                      {warning.name}: pedido {warning.requested}, disponible{' '}
                      {warning.available}. Se descontó hasta agotar.
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-navy/10">
              <table className="w-full text-sm">
                <thead className="bg-navy/5 text-left text-[10px] uppercase tracking-wider text-navy/60">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Mini</th>
                    <th className="px-3 py-2 font-semibold">Cant.</th>
                    <th className="px-3 py-2 text-right font-semibold">Unitario</th>
                    <th className="px-3 py-2 text-right font-semibold">Línea</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {selected.items.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-[11px] text-navy/60">
                          {item.categoryName} · {item.seriesName}
                        </p>
                      </td>
                      <td className="px-3 py-2">{item.qty}</td>
                      <td className="px-3 py-2 text-right">
                        {formatCents(item.unitPriceCents)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCents(item.lineTotalCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="space-y-1 text-sm">
              <div className="flex justify-between text-navy/60">
                <dt>Subtotal</dt>
                <dd>{formatCents(selected.subtotalCents)}</dd>
              </div>
              {selected.discountCents > 0 && (
                <div className="flex justify-between font-medium text-turquoise-ink">
                  <dt>Ahorro por ofertas</dt>
                  <dd>− {formatCents(selected.discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-navy/10 pt-1 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatCents(selected.totalCents)}</dd>
              </div>
            </dl>

            <p className="text-[11px] leading-relaxed text-navy/60">
              {statusLabel(selected.status)} · El código del mensaje de WhatsApp debe coincidir con
              el mostrado arriba.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
