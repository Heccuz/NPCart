import type { IOrderGateway } from '@/application/ports/order-gateway'
import type { CreateOrderResponse } from '@/domain/entities'
import { http } from './client'

export const orderGateway: IOrderGateway = {
  async createOrder(items) {
    const { data } = await http.post<CreateOrderResponse>('/api/orders', { items })
    return data
  },
}
