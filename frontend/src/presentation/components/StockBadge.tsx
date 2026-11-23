import { cn } from '../lib/cn'

export default function StockBadge({ stock, className }: { stock: number; className?: string }) {
  if (stock === 0) {
    return (
      <span
        className={cn(
          'rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-bone',
          className,
        )}
      >
        Agotado
      </span>
    )
  }

  if (stock <= 3) {
    return (
      <span
        className={cn(
          'rounded-full border border-ember bg-bone/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ember',
          className,
        )}
      >
        Quedan {stock}
      </span>
    )
  }

  return null
}
