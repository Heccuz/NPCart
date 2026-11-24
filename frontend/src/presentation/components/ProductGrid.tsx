import type { CategoryOffer, Product } from '@/domain/entities'
import { entryOffer } from '@/domain/offers'
import { cn } from '../lib/cn'
import ProductCard from './ProductCard'

interface ProductGridProps {
  products: Product[]
  offers?: CategoryOffer[]
  loading?: boolean
  skeletonCount?: number
  emptyState?: React.ReactNode
  onQuickAdd?: (product: Product) => void
  className?: string
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/5] animate-pulse bg-haze" />
      <div className="space-y-2 p-3.5">
        <div className="h-4 w-4/5 animate-pulse rounded bg-haze" />
        <div className="h-4 w-2/5 animate-pulse rounded bg-haze" />
      </div>
    </div>
  )
}

export default function ProductGrid({
  products,
  offers = [],
  loading = false,
  skeletonCount = 8,
  emptyState,
  onQuickAdd,
  className,
}: ProductGridProps) {
  if (loading) {
    return (
      <div
        className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4', className)}
      >
        {Array.from({ length: skeletonCount }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return <>{emptyState}</>
  }

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4', className)}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          offer={entryOffer(offers, product.categoryId)}
          onQuickAdd={onQuickAdd}
        />
      ))}
    </div>
  )
}
