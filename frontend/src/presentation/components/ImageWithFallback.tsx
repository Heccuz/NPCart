import { useState } from 'react'
import { resolveImageUrl } from '@/infrastructure/images/resolve-image-url'
import { cn } from '../lib/cn'

interface ImageWithFallbackProps {
  src: string | null | undefined
  alt: string
  className?: string
  imgClassName?: string
  priority?: boolean
  /** Oculta el texto "Sin foto" en miniaturas pequeñas. */
  hideLabel?: boolean
}

function MiniPlaceholder({ hideLabel }: { hideLabel?: boolean }) {
  return (
    <div className="bg-expressive flex h-full w-full flex-col items-center justify-center gap-1.5 text-brand-ink/70">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        className="h-[38%] max-h-12 min-h-4 w-[38%] min-w-4 max-w-12"
      >
        <circle cx="12" cy="5.5" r="2.5" />
        <path d="M9.5 10h5l1 4.5h-7l1-4.5Z" />
        <path d="M6 21l1.2-6.5h9.6L18 21" />
      </svg>
      {!hideLabel && (
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Sin foto</span>
      )}
    </div>
  )
}

export default function ImageWithFallback({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
  hideLabel = false,
}: ImageWithFallbackProps) {
  const resolved = resolveImageUrl(src, 800)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (!resolved || failed) {
    return (
      <div className={cn('overflow-hidden', className)}>
        <MiniPlaceholder hideLabel={hideLabel} />
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-haze', className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-haze" />}
      <img
        src={resolved}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName,
        )}
      />
    </div>
  )
}
