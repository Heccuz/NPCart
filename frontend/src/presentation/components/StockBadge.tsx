import { cn } from '../lib/cn'

export default function StockBadge({ stock, className }: { stock: number; className?: string }) {
  if (stock === 0) {
    return (
      <span
        className={cn(
          'rounded-full bg-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-mist',
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
          'rounded-full border border-turquoise-ink/40 bg-mist/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-turquoise-ink',
          className,
        )}
      >
        Quedan {stock}
      </span>
    )
  }

  return null
}
