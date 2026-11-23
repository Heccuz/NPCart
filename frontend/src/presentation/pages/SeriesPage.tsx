import { Link, useParams } from 'react-router-dom'
import { productToCartItem } from '@/application/use-cases/cart-actions'
import EmptyState from '@/presentation/components/EmptyState'
import ProductGrid from '@/presentation/components/ProductGrid'
import { useCart } from '@/presentation/hooks/useCart'
import { useOffers, useProducts, useSeries } from '@/presentation/hooks/useProducts'

export default function SeriesPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: seriesList = [], isLoading: seriesLoading } = useSeries()
  const { data: offers = [] } = useOffers()
  const { addItem } = useCart()

  const current = seriesList.find((item) => item.slug === slug)
  const { data, isLoading, isError, refetch } = useProducts({
    series: [slug ?? '__none__'],
    pageSize: 24,
  })

  const products = data?.items ?? []

  if (!seriesLoading && !current) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Serie no encontrada"
          description="Puede que la serie haya cambiado de nombre o ya no esté disponible."
          actionLabel="Ver catálogo"
          actionTo="/catalogo"
        />
      </div>
    )
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <nav aria-label="Migas de pan" className="text-xs text-ink/60">
        <Link to="/catalogo" className="hover:text-ink">
          Catálogo
        </Link>{' '}
        / <span className="text-ink/70">{current?.name ?? slug}</span>
      </nav>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Serie</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {current?.name ?? 'Serie'}
          </h1>
          <p className="mt-2 max-w-lg text-sm text-ink/60">
            Todas las minis de esta temática, en sus distintos tamaños.
          </p>
        </div>
        <p className="text-sm text-ink/60">{data?.total ?? 0} minis</p>
      </header>

      <div className="mt-6">
        <ProductGrid
          products={products}
          offers={offers}
          loading={isLoading || seriesLoading}
          onQuickAdd={(product) => addItem(productToCartItem(product))}
          emptyState={
            isError ? (
              <EmptyState
                title="No pudimos cargar esta serie"
                description="Revisa tu conexión e intenta de nuevo."
                actionLabel="Reintentar"
                onAction={() => refetch()}
              />
            ) : (
              <EmptyState
                title="Todavía no hay minis en esta serie"
                description="Estamos preparando nuevos modelos. Mientras tanto, mira el resto del catálogo."
                actionLabel="Ver catálogo"
                actionTo="/catalogo"
              />
            )
          }
        />
      </div>
    </div>
  )
}
