import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="container-page flex min-h-dvh flex-col items-center justify-center py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet">404</p>
      <h1 className="mt-3 font-display text-4xl">Esta página no existe</h1>
      <p className="mt-3 max-w-md text-navy/70">
        Puede que el link esté mal escrito o que la mini ya no esté disponible.
      </p>
      <Link to="/catalogo" className="btn-primary mt-8">
        Ver catálogo
      </Link>
    </div>
  )
}
