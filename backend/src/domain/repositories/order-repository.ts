import type {
  CreateOrderData,
  OrderDto,
  OrderListFilters,
  PaginatedOrders,
  StockWarning,
} from '../../application/dto/catalog'

export interface ConfirmOrderResult {
  order: OrderDto | null
  warnings: StockWarning[]
}

export interface IOrderRepository {
  createPending(data: CreateOrderData): Promise<OrderDto>
  existsByCode(code: string): Promise<boolean>
  list(filters: OrderListFilters): Promise<PaginatedOrders>
  findById(id: string): Promise<OrderDto | null>
  findByCode(code: string): Promise<OrderDto | null>
  confirm(id: string): Promise<ConfirmOrderResult>
  cancel(id: string): Promise<OrderDto | null>
}
