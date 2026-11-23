import axios from 'axios'
import { useAuthStore } from '@/application/store/auth-store'

const baseURL = import.meta.env.VITE_API_URL || ''

export const http = axios.create({
  baseURL,
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? ''
      if (url.includes('/api/admin/')) {
        useAuthStore.getState().logout()
      }
    }
    return Promise.reject(error)
  },
)

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string } } | undefined
    if (data?.error?.message) return data.error.message
    if (!error.response) return 'No pudimos conectar con el servidor. Revisa tu conexión.'
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
