import { Link } from 'react-router-dom'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/5 text-navy/60">
        {icon ?? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-7 w-7"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m20 20-4.2-4.2" />
          </svg>
        )}
      </div>
      <h3 className="font-display text-xl">{title}</h3>
      {description && <p className="max-w-sm text-sm text-navy/60">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-2">
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionTo && onAction && (
        <button type="button" onClick={onAction} className="btn-primary mt-2">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
