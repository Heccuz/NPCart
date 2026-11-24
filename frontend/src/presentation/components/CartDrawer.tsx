import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CartItem, CreateOrderResponse } from '@/domain/entities'
import { formatCents } from '@/domain/money'
import { buildWhatsAppMessage } from '@/application/use-cases/build-whatsapp-message'
import { useCart } from '@/presentation/hooks/useCart'
import { useOffers } from '@/presentation/hooks/useProducts'
import { apiErrorMessage } from '@/infrastructure/http/client'
import { orderGateway } from '@/infrastructure/http/order-gateway'
import { buildWaLink } from '@/infrastructure/whatsapp/wa-link-builder'
import { useCartUiStore } from '@/application/store/cart-ui-store'
import EmptyState from './EmptyState'
import ImageWithFallback from './ImageWithFallback'
import QuantityStepper from './QuantityStepper'
import { cn } from '../lib/cn'

function OfferProgress({
  units,
  nextOffer,
  appliedOffer,
  unitsToNextOffer,
  discountCents,
}: {
  units: number
  nextOffer: { minQuantity: number; unitPriceCents: number } | null
  appliedOffer: { minQuantity: number; unitPriceCents: number } | null
  unitsToNextOffer: number
  discountCents: number
}) {
  if (!nextOffer && !appliedOffer) return null

  if (nextOffer) {
    const pct = Math.min(100, Math.round((units / nextOffer.minQuantity) * 100))
    return (
      <div className="mt-2">
        <p className="text-[11px] leading-snug text-ink/60">
          {appliedOffer && `Oferta ${appliedOffer.minQuantity}+ activa · `}
          Te {unitsToNextOffer === 1 ? 'falta' : 'faltan'}{' '}
          <strong className="text-ink">{unitsToNextOffer}</strong>{' '}
          {unitsToNextOffer === 1 ? 'mini' : 'minis'} para{' '}
          {unitsToNextOffer === 1 ? 'que todas queden' : 'que todas queden'} a{' '}
          <strong className="text-ember">{formatCents(nextOffer.unitPriceCents)}</strong> c/u
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-ember transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    )
  }

  if (discountCents > 0) {
    return (
      <p className="mt-1 text-[11px] font-medium text-moss">
        Oferta aplicada: {formatCents(appliedOffer!.unitPriceCents)} c/u · ahorras{' '}
        {formatCents(discountCents)}
      </p>
    )
  }

  return <p className="mt-1 text-[11px] font-medium text-moss">Oferta completada</p>
}

export default function CartDrawer() {
  const isOpen = useCartUiStore((state) => state.isOpen)
  const close = useCartUiStore((state) => state.close)
  const navigate = useNavigate()
  const { items, pricing, lineByProduct, updateQty, removeItem, clear } = useCart()
  const { data: offers = [] } = useOffers()

  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<CreateOrderResponse | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, close])

  const breakdownByCategory = useMemo(
    () => new Map(pricing.categories.map((category) => [category.categoryId, category])),
    [pricing.categories],
  )

  const groups = useMemo(() => {
    const map = new Map<string, { categoryId: string; categoryName: string; items: CartItem[] }>()
    for (const item of items) {
      if (!map.has(item.categoryId)) {
        map.set(item.categoryId, {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          items: [],
        })
      }
      map.get(item.categoryId)!.items.push(item)
    }
    return [...map.values()]
  }, [items])

  if (!isOpen) return null

  const finishOrder = (response: CreateOrderResponse) => {
    const text = buildWhatsAppMessage(response.order, response.categories)
    clear()
    setPending(null)
    close()
    window.location.assign(buildWaLink(text))
  }

  const submit = async () => {
    if (items.length === 0) return
    setSending(true)
    setError('')
    try {
      const response = await orderGateway.createOrder(
        items.map((item) => ({ productId: item.productId, qty: item.qty })),
      )
      if (response.excluded.length > 0 || response.adjusted.length > 0) {
        setPending(response)
      } else {
        finishOrder(response)
      }
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Cerrar carrito"
        onClick={close}
        className="absolute inset-0 bg-ink/45 backdrop-blur-xs"
      />

      <aside
        aria-label="Carrito"
        className="absolute inset-0 flex flex-col bg-bone sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[440px] sm:shadow-2xl"
      >
        <header className="flex h-16 items-center justify-between border-b border-ink/10 px-4 sm:px-5">
          <div>
            <p className="font-display text-lg font-semibold">Tu pedido</p>
            <p className="text-xs text-ink/60">
              {items.reduce((sum, item) => sum + item.qty, 0)} minis en el carrito
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar carrito"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 text-lg"
          >
            ✕
          </button>
        </header>

        {pending ? (
          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-5">
            <div className="rounded-2xl border border-ember/40 bg-ember/5 p-4">
              <p className="font-display text-base font-semibold text-ember">
                Ajustamos tu pedido
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink/60">
                El pedido ya quedó registrado con el stock disponible. El total mostrado es el
                definitivo.
              </p>

              {pending.excluded.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">
                    Excluidos del pedido
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-ink/75">
                    {pending.excluded.map((item) => (
                      <li key={item.productId}>
                        {item.name} —{' '}
                        {item.reason === 'AGOTADO' ? 'agotado' : 'ya no disponible'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pending.adjusted.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">
                    Cantidades ajustadas
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-ink/75">
                    {pending.adjusted.map((item) => (
                      <li key={item.productId}>
                        {item.name}: quedan {item.availableQty} (pediste {item.requestedQty})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-3 text-sm font-semibold">
                Total: {formatCents(pending.order.totalCents)}
              </p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-5">
            <EmptyState
              title="Tu carrito está vacío"
              description="Agrega minis del catálogo y aquí verás las ofertas por cantidad."
              actionLabel="Ver catálogo"
              onAction={() => {
                close()
                navigate('/catalogo')
              }}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="space-y-6">
              {groups.map((group) => {
                const breakdown = breakdownByCategory.get(group.categoryId)
                return (
                  <section key={group.categoryId}>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-sm font-semibold">{group.categoryName}</h3>
                      <span className="text-[11px] text-ink/60">
                        {breakdown?.units ?? group.items.reduce((sum, item) => sum + item.qty, 0)}{' '}
                        unid.
                      </span>
                    </div>

                    {breakdown && (
                      <OfferProgress
                        units={breakdown.units}
                        nextOffer={breakdown.nextOffer}
                        appliedOffer={breakdown.offer}
                        unitsToNextOffer={breakdown.unitsToNextOffer}
                        discountCents={breakdown.discountCents}
                      />
                    )}

                    <ul className="mt-3 space-y-3">
                      {group.items.map((item) => {
                        const line = lineByProduct.get(item.productId)
                        const effectivePrice = line?.effectiveUnitPriceCents ?? item.priceCents
                        const discounted = effectivePrice < item.priceCents
                        return (
                          <li
                            key={item.productId}
                            className="flex gap-3 rounded-2xl border border-ink/10 bg-white/60 p-3"
                          >
                            <ImageWithFallback
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-16 w-16 shrink-0 rounded-xl" hideLabel
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-display text-sm font-semibold">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-ink/60">{item.seriesName}</p>
                              <div className="mt-1 flex items-center gap-1.5 text-sm">
                                <span className={cn('font-semibold', discounted && 'text-ember')}>
                                  {formatCents(effectivePrice)}
                                </span>
                                {discounted && (
                                  <span className="text-[11px] text-ink/55 line-through">
                                    {formatCents(item.priceCents)}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <QuantityStepper
                                  value={item.qty}
                                  max={item.stock}
                                  onChange={(qty) => updateQty(item.productId, qty)}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.productId)}
                                  className="text-[11px] font-medium text-ink/60 underline-offset-4 hover:text-ember hover:underline"
                                >
                                  Quitar
                                </button>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )
              })}
            </div>
            {offers.length === 0 && (
              <p className="mt-5 text-[11px] text-ink/60">
                Las ofertas por cantidad se aplican automáticamente al enviar.
              </p>
            )}
          </div>
        )}

        {!pending && items.length > 0 && (
          <footer className="border-t border-ink/10 bg-bone px-4 pb-5 pt-4 sm:px-5">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between text-ink/60">
                <dt>Subtotal</dt>
                <dd>{formatCents(pricing.subtotalCents)}</dd>
              </div>
              {pricing.discountCents > 0 && (
                <div className="flex justify-between font-medium text-moss">
                  <dt>Ahorro por ofertas</dt>
                  <dd>− {formatCents(pricing.discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-1 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatCents(pricing.totalCents)}</dd>
              </div>
            </dl>

            {error && (
              <p className="mt-3 rounded-xl bg-ember/10 px-3 py-2 text-xs text-ember">{error}</p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={sending}
              className="btn-ember mt-4 h-12 w-full text-base"
            >
              {sending ? 'Preparando pedido…' : 'Enviar pedido por WhatsApp'}
            </button>
            <p className="mt-2 text-center text-[11px] leading-snug text-ink/60">
              Abre WhatsApp con tu pedido y un código verificable. Confirmas con el vendedor.
            </p>
          </footer>
        )}

        {pending && (
          <footer className="border-t border-ink/10 bg-bone px-4 pb-5 pt-4 sm:px-5">
            <button
              type="button"
              onClick={() => finishOrder(pending)}
              className="btn-ember h-12 w-full text-base"
            >
              Continuar por WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="btn-ghost mt-2 h-11 w-full"
            >
              Volver al carrito
            </button>
          </footer>
        )}
      </aside>
    </div>
  )
}
