import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/application/store/auth-store'
import { authGateway } from '@/infrastructure/http/auth-gateway'
import { apiErrorMessage } from '@/infrastructure/http/client'

export default function AdminLoginPage() {
  const token = useAuthStore((state) => state.token)
  const setSession = useAuthStore((state) => state.setSession)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/admin/productos" replace />

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const session = await authGateway.login(email, password)
      setSession(session.token, session.email)
      navigate('/admin/productos', { replace: true })
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="font-display text-2xl font-extrabold">
            NPCart<span className="text-ember">.</span>
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-ink/60">Panel admin</p>
        </div>

        <form onSubmit={submit} className="card mt-8 space-y-4 p-6">
          <h1 className="font-display text-lg font-semibold">Iniciar sesión</h1>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input"
              placeholder="admin@npcart.local"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-ember/10 px-3 py-2 text-xs text-ember" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary h-11 w-full">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-ink/60">
          <a href="/" className="underline-offset-4 hover:underline">
            Volver a la tienda
          </a>
        </p>
      </div>
    </div>
  )
}
