import { Link } from 'react-router-dom'
import type { Series } from '@/domain/entities'
import ImageWithFallback from './ImageWithFallback'

export default function SeriesCarousel({ series }: { series: Series[] }) {
  if (series.length === 0) return null

  return (
    <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {series.map((item) => (
        <Link
          key={item.id}
          to={`/series/${item.slug}`}
          className="group relative w-40 shrink-0 snap-start overflow-hidden rounded-2xl border border-navy/10 bg-brand-deep sm:w-48"
        >
          <ImageWithFallback
            src={item.imageUrl}
            alt={item.name}
            className="aspect-[4/5] w-full opacity-90"
            imgClassName="transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-deep/90 to-transparent p-3 pt-10">
            <p className="font-display text-sm text-brand-ink">{item.name}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
