import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useCart } from '@/presentation/hooks/useCart'
import { useCartRevalidation } from '@/presentation/hooks/useCartRevalidation'

function CartButton() {
  const { count } = useCart()

  return (
    <button
      type="button"
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 transition hover:border-ink/40"
      aria-label={`Carrito (${count} ítems)`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M6 7h12l-1.3 10.4a2 2 0 0 1-2 1.6H9.3a2 2 0 0 1-2-1.6L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  )
}

export default function PublicLayout() {
  useCartRevalidation()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-bone/85 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
            NPCart<span className="text-ember">.</span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
            <Link
              to="/catalogo"
              className="rounded-full px-4 py-2 transition hover:bg-ink/5"
            >
              Catálogo
            </Link>
            <Link to="/#series" className="rounded-full px-4 py-2 transition hover:bg-ink/5">
              Series
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/catalogo"
              className="btn-ghost h-11 px-4 text-sm sm:hidden"
            >
              Catálogo
            </Link>
            <CartButton />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-ink/10 py-10">
        <div className="container-page flex flex-col gap-4 text-sm text-ink/60 sm:flex-row sm:items-center sm:justify-between">
          <p>NPCart — minis impresas en 3D, hechas a pedido en Perú.</p>
          <p className="text-xs uppercase tracking-[0.18em]">
            Pedidos por WhatsApp · Lima, Perú
          </p>
        </div>
      </footer>
    </div>
  )
}
