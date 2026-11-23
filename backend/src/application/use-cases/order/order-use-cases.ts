import { randomInt } from 'node:crypto'
import { priceCart, type CartLineInput } from '@npcart/pricing'
import type {
  AdjustedOrderItem,
  CreateOrderResult,
  ExcludedOrderItem,
  OrderDto,
  OrderItemDto,
  OrderListFilters,
  PaginatedOrders,
  StockWarning,
} from '../../dto/catalog'
import type { IOrderRepository } from '../../../domain/repositories/order-repository'
import type { IProductRepository } from '../../../domain/repositories/product-repository'
import type { IOfferRepository } from '../../../domain/repositories/offer-repository'
import { Order } from '../../../domain/entities/order'
import { notFound, unprocessable } from '../../errors/app-error'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export interface OrderItemInput {
  productId: string
  qty: number
}

export interface ConfirmOrderOutput {
  order: OrderDto
  warnings: StockWarning[]
}

export class OrderUseCases {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly products: IProductRepository,
    private readonly offers: IOfferRepository,
  ) {}

  private async generateCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      let suffix = ''
      for (let i = 0; i < 4; i++) {
        suffix += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]
      }
      const code = `NPC-${suffix}`
      if (!(await this.orders.existsByCode(code))) return code
    }
    throw new Error('No se pudo generar un código de pedido único')
  }

  async create(items: OrderItemInput[]): Promise<CreateOrderResult> {
    const merged = new Map<string, number>()
    for (const item of items) {
      merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.qty)
    }

    const products = await this.products.findByIds([...merged.keys()])
    const byId = new Map(products.map((product) => [product.id, product]))

    const excluded: ExcludedOrderItem[] = []
    const adjusted: AdjustedOrderItem[] = []
    const lines: CartLineInput[] = []

    for (const [productId, requestedQty] of merged) {
      const product = byId.get(productId)

      if (!product || product.deletedAt || !product.isActive) {
        excluded.push({
          productId,
          name: product?.name ?? 'Producto',
          reason: 'NO_DISPONIBLE',
          requestedQty,
        })
        continue
      }

      if (product.stock === 0) {
        excluded.push({ productId, name: product.name, reason: 'AGOTADO', requestedQty })
        continue
      }

      const qty = Math.min(requestedQty, product.stock)
      if (qty < requestedQty) {
        adjusted.push({
          productId,
          name: product.name,
          requestedQty,
          availableQty: product.stock,
        })
      }

      lines.push({
        productId,
        categoryId: product.categoryId,
        unitPriceCents: product.priceCents,
        qty,
      })
    }

    if (lines.length === 0) {
      throw unprocessable('NO_AVAILABLE_ITEMS', 'Ningún ítem del carrito está disponible')
    }

    const categoryIds = [...new Set(lines.map((line) => line.categoryId))]
    const offers = await this.offers.listActiveByCategoryIds(categoryIds)
    const pricing = priceCart(
      lines,
      offers.map((offer) => ({
        categoryId: offer.categoryId,
        minQuantity: offer.minQuantity,
        unitPriceCents: offer.unitPriceCents,
      })),
    )

    const orderItems: OrderItemDto[] = pricing.lines.map((line) => {
      const product = byId.get(line.productId)!
      return {
        productId: line.productId,
        name: product.name,
        categoryName: product.category.name,
        seriesName: product.primarySeries.name,
        unitPriceCents: line.effectiveUnitPriceCents,
        qty: line.qty,
        lineTotalCents: line.lineTotalCents,
      }
    })

    const entity = Order.create({
      code: await this.generateCode(),
      items: orderItems,
      subtotalCents: pricing.subtotalCents,
      discountCents: pricing.discountCents,
      totalCents: pricing.totalCents,
    })

    const order = await this.orders.createPending({
      code: entity.props.code,
      subtotalCents: entity.props.subtotalCents,
      discountCents: entity.props.discountCents,
      totalCents: entity.props.totalCents,
      items: entity.items,
    })

    const categoryNameById = new Map<string, string>()
    for (const line of pricing.lines) {
      const product = byId.get(line.productId)
      if (product) categoryNameById.set(line.categoryId, product.category.name)
    }

    const categories = pricing.categories.map((category) => ({
      categoryId: category.categoryId,
      categoryName: categoryNameById.get(category.categoryId) ?? 'Mini',
      units: category.units,
      appliedOffer: category.offer
        ? {
            minQuantity: category.offer.minQuantity,
            unitPriceCents: category.offer.unitPriceCents,
          }
        : null,
      discountCents: category.discountCents,
    }))

    return { order, categories, excluded, adjusted }
  }

  listAdmin(filters: OrderListFilters): Promise<PaginatedOrders> {
    return this.orders.list(filters)
  }

  async getAdmin(id: string): Promise<OrderDto> {
    const order = await this.orders.findById(id)
    if (!order) throw notFound('ORDER_NOT_FOUND', 'Pedido no encontrado')
    return order
  }

  async confirm(id: string): Promise<ConfirmOrderOutput> {
    const result = await this.orders.confirm(id)
    if (!result.order) throw notFound('ORDER_NOT_FOUND', 'Pedido no encontrado')
    return { order: result.order, warnings: result.warnings }
  }

  async cancel(id: string): Promise<OrderDto> {
    const order = await this.orders.cancel(id)
    if (!order) throw notFound('ORDER_NOT_FOUND', 'Pedido no encontrado')
    return order
  }
}
