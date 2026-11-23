import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CategoryOffer, Product } from '@/domain/entities'
import { formatCents } from '@/domain/money'
import { cn } from '../lib/cn'
import ImageWithFallback from './ImageWithFallback'
import StockBadge from './StockBadge'

interface ProductCardProps {
  product: Product
  offer?: CategoryOffer | null
  onQuickAdd?: (product: Product) => void
}

export default function ProductCard({ product, offer, onQuickAdd }: ProductCardProps) {
  const soldOut = product.stock === 0
  const hasOffer = Boolean(offer && offer.unitPriceCents < product.priceCents)
  // "Mini mediana" → "Mediana": cabe sin solaparse con el badge de stock.
  const shortCategory = product.category.name.replace(/^Mini\s+/i, '')
  const [added, setAdded] = useState(false)

  const handleQuickAdd = () => {
    if (!onQuickAdd) return
    onQuickAdd(product)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1200)
  }

  return (
    <Link
      to={`/producto/${product.id}`}
      className={cn(
        'group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card',
        soldOut && 'opacity-60',
      )}
    >
      <div className="relative">
        <ImageWithFallback
          src={product.imageUrl}
          alt={product.name}
          className="aspect-[4/5] w-full"
          imgClassName="transition duration-500 group-hover:scale-[1.04]"
        />

        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <span className="chip min-w-0 max-w-[55%] truncate">{shortCategory}</span>
          <StockBadge stock={product.stock} className="shrink-0" />
        </div>

        {!soldOut && onQuickAdd && (
          <button
            type="button"
            aria-label={`Agregar ${product.name} al carrito`}
            onClick={(event) => {
              event.preventDefault()
              handleQuickAdd()
            }}
            className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-lg font-bold text-bone shadow-card transition hover:bg-ember"
          >
            {added ? '✓' : '+'}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-ink/40">
          {product.primarySeries.name}
        </p>
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.5em] font-display text-[15px] font-semibold leading-snug">
          {product.name}
        </h3>
        <div className="mt-auto pt-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[15px] font-semibold">{formatCents(product.priceCents)}</span>
            {soldOut && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">
                Agotado
              </span>
            )}
          </div>
          <p className="mt-0.5 h-4 truncate text-[11px] font-semibold text-ember">
            {hasOffer && offer
              ? `Oferta ${offer.minQuantity}+: ${formatCents(offer.unitPriceCents)} c/u`
              : ''}
          </p>
        </div>
      </div>
    </Link>
  )
}
