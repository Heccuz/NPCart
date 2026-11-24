import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useCartUiStore } from '@/application/store/cart-ui-store'
import CartDrawer from '@/presentation/components/CartDrawer'
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
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-turquoise px-1 text-[11px] font-bold text-navy">
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
          <Link to="/" className="font-display text-2xl tracking-tight">
            NPCart<span className="text-turquoise">.</span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
            <Link
              to="/catalogo"
              className="rounded-full px-4 py-2 transition hover:bg-navy/5"
            >
              Catálogo
            </Link>
            <Link to="/#series" className="rounded-full px-4 py-2 transition hover:bg-navy/5">
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
            <CartButton onClick={openCart} />
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-hidden">
        <Outlet />
      </main>

      <CartDrawer />

      <footer className="mt-20 border-t border-navy/10 py-10">
        <div className="container-page flex flex-col gap-4 text-sm text-navy/60 sm:flex-row sm:items-center sm:justify-between">
          <p>NPCart — minis impresas en 3D, hechas a pedido en Perú.</p>
          <p className="text-xs uppercase tracking-[0.18em]">
            Pedidos por WhatsApp · Lima, Perú
          </p>
        </div>
      </footer>
    </div>
  )
}
