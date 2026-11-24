import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/application/store/auth-store'
import { useCartUiStore } from '@/application/store/cart-ui-store'
import CartDrawer from '@/presentation/components/CartDrawer'
import BrandMark from '@/presentation/components/BrandMark'
import ThemeToggle from '@/presentation/components/ThemeToggle'
import { useCart } from '@/presentation/hooks/useCart'
import { useCartRevalidation } from '@/presentation/hooks/useCartRevalidation'

function CartButton({ onClick }: { onClick: () => void }) {
  const { count } = useCart()

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-navy/15 transition hover:border-navy/40"
      aria-label={`Abrir carrito (${count} ítems)`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <circle cx="9.5" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M3 4h2l2.1 11.2h11.7L21 7H6" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-turquoise px-1 text-[11px] font-bold text-brand">
          {count}
        </span>
      )}
    </button>
  )
}

export default function PublicLayout() {
  useCartRevalidation()
  const { pathname } = useLocation()
  const openCart = useCartUiStore((state) => state.open)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-mist"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 border-b border-navy/10 bg-mist/85 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl tracking-tight">
            <BrandMark className="h-8 w-8" />
            <span>
              Alvina 3D<span className="text-turquoise">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
            <Link to="/catalogo" className="rounded-full px-4 py-2 transition hover:bg-navy/5">
              Catálogo
            </Link>
            <Link to="/#series" className="rounded-full px-4 py-2 transition hover:bg-navy/5">
              Series
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {token && (
              <Link
                to="/admin/productos"
                className="btn-ghost hidden h-11 px-4 text-sm sm:inline-flex"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Panel admin
              </Link>
            )}
            <ThemeToggle className="h-11 w-11 border-navy/15 text-navy/70 hover:border-navy/40 hover:bg-navy/5" />
            <Link to="/catalogo" className="btn-ghost h-11 px-4 text-sm sm:hidden">
              Catálogo
            </Link>
            <CartButton onClick={openCart} />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="h-0.5 bg-gradient-to-r from-brand via-violet-brand to-turquoise"
        />
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-hidden">
        <Outlet />
      </main>

      <CartDrawer />

      <footer className="mt-20 bg-expressive py-10 text-brand-ink">
        <div className="container-page flex flex-col gap-4 text-sm text-brand-ink/70 sm:flex-row sm:items-center sm:justify-between">
          <p>Alvina 3D — miniaturas y piezas personalizadas, hechas a pedido en Perú.</p>
          <p className="text-xs uppercase tracking-[0.18em] text-brand-ink/60">
            Pedidos por WhatsApp · Cajamarca, Perú
          </p>
        </div>
      </footer>
    </div>
  )
}
