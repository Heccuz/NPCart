import { Link } from 'react-router-dom'
import type { Product } from '@/domain/entities'
import { formatCents } from '@/domain/money'
import { offersForCategory } from '@/domain/offers'
import { buildWaLink } from '@/infrastructure/whatsapp/wa-link-builder'
import { productToCartItem } from '@/application/use-cases/cart-actions'
import ImageWithFallback from '@/presentation/components/ImageWithFallback'
import ProductGrid from '@/presentation/components/ProductGrid'
import SeriesCarousel from '@/presentation/components/SeriesCarousel'
import { useCart } from '@/presentation/hooks/useCart'
import {
  useCategories,
  useFeaturedProducts,
  useOffers,
  useSeries,
} from '@/presentation/hooks/useProducts'

function HeroArt({ products }: { products: Product[] }) {
  const cards = products.slice(0, 3)

  return (
    <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-turquoise/20 via-navy-mid/70 to-violet/25 blur-2xl"
      />
      <div className="relative grid grid-cols-2 gap-3">
        <div className="card overflow-hidden">
          <ImageWithFallback
            src={cards[0]?.imageUrl}
            alt={cards[0]?.name ?? 'Mini de muestra'}
            className="aspect-[4/5] w-full"
            priority
          />
        </div>
        <div className="card mt-8 overflow-hidden">
          <ImageWithFallback
            src={cards[1]?.imageUrl}
            alt={cards[1]?.name ?? 'Mini de muestra'}
            className="aspect-[4/5] w-full"
            priority
          />
        </div>
        <div className="card -mt-4 overflow-hidden">
          <ImageWithFallback
            src={cards[2]?.imageUrl}
            alt={cards[2]?.name ?? 'Mini de muestra'}
            className="aspect-[4/5] w-full"
          />
        </div>
        <div className="mt-4 flex items-center justify-center rounded-2xl border border-turquoise/30 bg-turquoise p-4 text-center">
          <div>
            <p className="font-display text-3xl text-navy">100%</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-navy/70">hecho a pedido</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const steps = [
  {
    title: 'Elige tus minis',
    body: 'Filtra por tamaño y serie. Las ofertas por cantidad se aplican solas.',
  },
  {
    title: 'Envía tu pedido',
    body: 'Un clic abre WhatsApp con tu pedido y un código verificable.',
  },
  {
    title: 'Coordinamos',
    body: 'Confirmamos disponibilidad, tiempo de impresión y entrega.',
  },
]

export default function HomePage() {
  const featured = useFeaturedProducts()
  const series = useSeries()
  const offers = useOffers()
  const categories = useCategories()
  const { addItem } = useCart()

  const featuredData = featured.data ?? []
  const offersData = offers.data ?? []
  const categoriesData = categories.data ?? []
  const categoriesWithOffers = categoriesData.filter(
    (category) => offersForCategory(offersData, category.id).length > 0,
  )

  return (
    <div>
      <section className="overflow-hidden bg-navy text-mist">
        <div className="container-page grid gap-10 py-10 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <p className="eyebrow-light">Impresión 3D · Lima, Perú</p>
            <h1 className="mt-4 font-display text-[2.6rem] leading-[1.02] tracking-tight sm:text-6xl">
              Minis que <span className="text-turquoise">dan vida</span> a tu mesa.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-mist/70">
              Figuras impresas en 3D al detalle para D&amp;D, colección o regalo. Elige el
              tamaño, mezcla tus series favoritas y pide por WhatsApp.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/catalogo" className="btn-accent h-12 px-7 text-base">
                Ver catálogo
              </Link>
              <a
                href={buildWaLink('Hola Alvina 👋 Quiero ver qué minis tienen disponibles.')}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost-light h-12 px-7 text-base"
              >
                Pedir por WhatsApp
              </a>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-mist/15 pt-6 text-sm">
              <div>
                <dt className="font-display text-lg">2–5 cm</dt>
                <dd className="text-xs text-mist/60">3 tamaños</dd>
              </div>
              <div>
                <dt className="font-display text-lg">A pedido</dt>
                <dd className="text-xs text-mist/60">Impresión propia</dd>
              </div>
              <div>
                <dt className="font-display text-lg">S/ 8</dt>
                <dd className="text-xs text-mist/60">Desde</dd>
              </div>
            </dl>
          </div>

          <HeroArt products={featuredData} />
        </div>
      </section>

      <section id="series" className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Descubre</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl">
              Series para tu mesa
            </h2>
          </div>
          <Link to="/catalogo" className="text-sm font-semibold text-navy hover:underline hover:text-turquoise-ink">
            Ver todo el catálogo
          </Link>
        </div>
        <div className="mt-5">
          {series.isLoading ? (
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-48 w-40 shrink-0 animate-pulse rounded-2xl bg-haze sm:w-48" />
              ))}
            </div>
          ) : (
            <SeriesCarousel series={series.data ?? []} />
          )}
        </div>
      </section>

      {categoriesWithOffers.length > 0 && (
        <section className="container-page py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Ahorra por cantidad</p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl">
                Ofertas por tamaño
              </h2>
            </div>
            <p className="max-w-sm text-sm text-navy/60">
              Mezcla series libremente: lo que importa es cuántas minis del mismo tamaño llevas.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesWithOffers.map((category) => (
              <div key={category.id} className="card p-5">
                <p className="font-display text-lg">{category.name}</p>
                <p className="mt-1 text-xs text-navy/60">Cualquier serie de este tamaño</p>
                <div className="mt-4 space-y-2">
                  {offersForCategory(offersData, category.id).map((tier) => (
                    <div key={tier.id} className="flex items-baseline justify-between text-sm">
                      <span className="text-navy/60">Lleva {tier.minQuantity}+</span>
                      <span className="font-semibold">
                        {formatCents(tier.unitPriceCents)}{' '}
                        <span className="text-xs font-medium text-navy/60">c/u</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Selección</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl">
              Destacadas de la semana
            </h2>
          </div>
          <Link to="/catalogo" className="text-sm font-semibold text-navy hover:underline hover:text-turquoise-ink">
            Ver todas
          </Link>
        </div>
        <div className="mt-5">
          {featured.isError ? (
            <div className="card px-5 py-10 text-center text-sm text-navy/60">
              No pudimos cargar las destacadas.{' '}
              <button
                type="button"
                onClick={() => featured.refetch()}
                className="font-semibold text-violet underline-offset-4 hover:underline"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <ProductGrid
              products={featuredData}
              offers={offersData}
              loading={featured.isLoading}
              skeletonCount={4}
              onQuickAdd={(product) => addItem(productToCartItem(product))}
            />
          )}
        </div>
      </section>

      <section className="container-page py-12">
        <div className="rounded-3xl bg-navy px-6 py-10 text-mist sm:px-10">
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title}>
                <span className="font-display text-sm text-turquoise">
                  0{index + 1}
                </span>
                <h3 className="mt-2 font-display text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist/60">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
