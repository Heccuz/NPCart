import type { IAuthGateway } from '@/application/ports/auth-gateway'
import { http } from './client'

export const authGateway: IAuthGateway = {
  async login(email, password) {
    const { data } = await http.post<{ token: string; email: string }>('/api/auth/login', {
      email,
      password,
    })
    return data
  },
}
