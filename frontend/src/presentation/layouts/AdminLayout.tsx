import type { ReactNode } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/application/store/auth-store'
import { cn } from '@/presentation/lib/cn'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

const links = [
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/categorias', label: 'Categorías' },
  { to: '/admin/series', label: 'Series' },
  { to: '/admin/ofertas', label: 'Ofertas' },
]

export default function AdminLayout() {
  const email = useAuthStore((state) => state.email)
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="min-h-dvh bg-mist">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-navy text-mist lg:flex">
        <div className="border-b border-bone/10 px-5 py-5">
          <p className="font-display text-xl">
            Alvina 3D<span className="text-turquoise">.</span>
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-mist/60">Panel admin</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'block rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-mist/10 text-mist'
                    : 'text-mist/60 hover:bg-mist/5 hover:text-mist',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-bone/10 px-5 py-4 text-xs">
          <p className="truncate text-mist/65">{email}</p>
          <Link to="/" className="block text-mist/60 transition hover:text-mist">
            Ver tienda
          </Link>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-xl border border-bone/15 px-3 py-2 text-left font-medium text-mist/70 transition hover:border-bone/40 hover:text-mist"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-navy/10 bg-mist/85 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link to="/admin/productos" className="font-display text-lg">
              Alvina 3D<span className="text-turquoise">.</span>
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-navy/60">
                Admin
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/" className="text-xs font-medium text-navy/60">
                Tienda
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold"
              >
                Salir
              </button>
            </div>
          </div>
          <nav className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold',
                    isActive ? 'border-navy bg-navy text-mist' : 'border-navy/10 text-navy/60',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main id="admin-main" tabIndex={-1} className="container-page py-6 outline-hidden sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
