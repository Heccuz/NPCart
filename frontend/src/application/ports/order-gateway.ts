import type { CreateOrderResponse } from '@/domain/entities'

export interface IOrderGateway {
  createOrder(items: { productId: string; qty: number }[]): Promise<CreateOrderResponse>
}
