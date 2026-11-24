import { cn } from '@/presentation/lib/cn'

/** Icono de marca (mismo archivo del favicon) para acompañar al wordmark. */
export default function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/favicon.ico"
      alt=""
      aria-hidden="true"
      className={cn('shrink-0 rounded-lg', className)}
    />
  )
}
