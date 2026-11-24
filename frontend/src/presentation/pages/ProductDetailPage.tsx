import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Product } from '@/domain/entities'
import { formatCents } from '@/domain/money'
import { offersForCategory } from '@/domain/offers'
import { productToCartItem } from '@/application/use-cases/cart-actions'
import EmptyState from '@/presentation/components/EmptyState'
import ImageWithFallback from '@/presentation/components/ImageWithFallback'
import OfferBadge from '@/presentation/components/OfferBadge'
import ProductGrid from '@/presentation/components/ProductGrid'
import StockBadge from '@/presentation/components/StockBadge'
import { useCart } from '@/presentation/hooks/useCart'
import { useOffers, useProduct, useProducts } from '@/presentation/hooks/useProducts'

function DetailSkeleton() {
  return (
    <div className="container-page py-8">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="aspect-square animate-pulse rounded-3xl bg-haze" />
        <div className="space-y-4">
          <div className="h-5 w-32 animate-pulse rounded bg-haze" />
          <div className="h-10 w-2/3 animate-pulse rounded bg-haze" />
          <div className="h-7 w-24 animate-pulse rounded bg-haze" />
          <div className="h-24 w-full animate-pulse rounded bg-haze" />
          <div className="h-12 w-full animate-pulse rounded-full bg-haze" />
        </div>
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: product, isLoading, isError, refetch } = useProduct(id)
  const { data: offers = [] } = useOffers()
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const relatedQuery = useProducts({
    series: [product?.primarySeries.slug ?? '__none__'],
    pageSize: 5,
  })

  if (isLoading) return <DetailSkeleton />

  if (isError) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="No pudimos cargar esta mini"
          description="Revisa tu conexión e intenta de nuevo."
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Esta mini no está disponible"
          description="Puede que se haya agotado o que el link esté mal escrito."
          actionLabel="Volver al catálogo"
          actionTo="/catalogo"
        />
      </div>
    )
  }

  const soldOut = product.stock === 0
  const tiers = offersForCategory(offers, product.categoryId)
  const related = (relatedQuery.data?.items ?? [])
    .filter((item) => item.id !== product.id)
    .slice(0, 4)

  const handleAdd = () => {
    addItem(productToCartItem(product))
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="container-page py-6 sm:py-10">
      <nav aria-label="Migas de pan" className="text-xs text-navy/60">
        <Link to="/catalogo" className="hover:text-navy">
          Catálogo
        </Link>{' '}
        / <span className="text-navy/70">{product.category.name}</span>
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <ImageWithFallback
            src={product.imageUrl}
            alt={product.name}
            className="aspect-square w-full rounded-3xl border border-navy/10"
            priority
          />
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            <span className="chip chip-active">{product.category.name}</span>
            {product.series.map((item) => (
              <Link key={item.id} to={`/series/${item.slug}`} className="chip hover:border-navy/40">
                {item.name}
              </Link>
            ))}
          </div>

          <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-2xl font-semibold">{formatCents(product.priceCents)}</p>
            {tiers[0] && <OfferBadge offer={tiers[0]} priceCents={product.priceCents} />}
            <StockBadge stock={product.stock} />
          </div>

          {tiers.length > 0 && (
            <div className="bg-expressive-card mt-5 rounded-2xl p-4 text-brand-ink">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-turquoise">
                Ofertas por cantidad
              </p>
              <ul className="mt-2 space-y-1 text-sm text-brand-ink/70">
                {tiers.map((tier) => (
                  <li key={tier.id}>
                    Lleva {tier.minQuantity}+ y paga{' '}
                    <strong className="text-brand-ink">{formatCents(tier.unitPriceCents)}</strong>{' '}
                    c/u
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-brand-ink/60">
                Se mezclan todas las minis de este tamaño, sin importar la serie.
              </p>
            </div>
          )}

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-navy/70">
            {product.details ||
              'Mini impresa en 3D bajo pedido. Escríbenos por WhatsApp si quieres un acabado o escala distinta.'}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleAdd}
              disabled={soldOut}
              className="btn-accent h-12 flex-1 text-base sm:flex-none sm:px-8"
            >
              {soldOut ? 'Agotado' : added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
            </button>
            <Link to="/catalogo" className="btn-ghost h-12">
              Seguir viendo
            </Link>
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-4 border-t border-navy/10 pt-5 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-navy/60">Tamaño</dt>
              <dd className="mt-0.5 font-medium">{product.category.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-navy/60">Disponibles</dt>
              <dd className="mt-0.5 font-medium">
                {soldOut ? 'Sin stock' : `${product.stock} unidades`}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-navy/60">Serie principal</dt>
              <dd className="mt-0.5 font-medium">{product.primarySeries.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-navy/60">Impresión</dt>
              <dd className="mt-0.5 font-medium">Bajo pedido</dd>
            </div>
          </dl>
        </div>
      </div>

      {related.length > 1 && (
        <section className="mt-14">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl">También te puede interesar</h2>
            <Link to="/catalogo" className="text-sm font-semibold text-violet hover:underline">
              Ver todo
            </Link>
          </div>
          <div className="mt-4">
            <ProductGrid
              products={related as Product[]}
              offers={offers}
              onQuickAdd={(item) => addItem(productToCartItem(item))}
            />
          </div>
        </section>
      )}
    </div>
  )
}
