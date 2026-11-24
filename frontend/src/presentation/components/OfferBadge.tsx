import type { CategoryOffer } from '@/domain/entities'

export default function OfferBadge({
  offer,
  priceCents,
  className,
}: {
  offer: CategoryOffer
  priceCents: number
  className?: string
}) {
  if (offer.unitPriceCents >= priceCents) return null

  return (
    <span
      className={`rounded-full bg-turquoise px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy ${className ?? ''}`}
    >
      {offer.minQuantity}+ · oferta
    </span>
  )
}
