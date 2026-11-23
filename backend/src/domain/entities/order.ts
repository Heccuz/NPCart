import { assertDomain } from '../errors/domain-error'
import { Money } from '../value-objects/money'

export type OrderStatus = 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO'

export const ORDER_STATUSES: OrderStatus[] = ['PENDIENTE', 'CONFIRMADO', 'CANCELADO']

export interface OrderItemProps {
  productId: string
  name: string
  categoryName: string
  seriesName: string
  unitPriceCents: number
  qty: number
  lineTotalCents: number
}

export interface OrderProps {
  id: string
  code: string
  status: OrderStatus
  subtotalCents: number
  discountCents: number
  totalCents: number
  createdAt: Date
  confirmedAt: Date | null
}

export const ORDER_CODE_PATTERN = /^NPC-[A-Z0-9]{4}$/

/** Pedido: snapshot inmutable de ítems y totales verificados por el servidor. */
export class Order {
  private constructor(
    public readonly props: OrderProps,
    public readonly items: OrderItemProps[],
  ) {}

  static create(input: {
    id?: string
    code: string
    items: OrderItemProps[]
    subtotalCents: number
    discountCents: number
    totalCents: number
  }): Order {
    assertDomain(ORDER_CODE_PATTERN.test(input.code), 'INVALID_ORDER_CODE', `Código de pedido inválido: "${input.code}"`)
    assertDomain(input.items.length >= 1, 'EMPTY_ORDER', 'El pedido no puede estar vacío')

    const subtotal = Money.fromCents(input.subtotalCents)
    const discount = Money.fromCents(input.discountCents)
    const total = Money.fromCents(input.totalCents)

    assertDomain(discount.cents <= subtotal.cents, 'INVALID_DISCOUNT', 'El descuento no puede superar el subtotal')
    assertDomain(total.cents === subtotal.cents - discount.cents, 'INVALID_TOTAL', 'El total no cuadra con subtotal - descuento')

    for (const item of input.items) {
      assertDomain(item.qty > 0 && Number.isInteger(item.qty), 'INVALID_ITEM_QTY', `Cantidad inválida en "${item.name}"`)
      Money.fromCents(item.unitPriceCents)
      Money.fromCents(item.lineTotalCents)
    }

    return new Order(
      {
        id: input.id ?? '',
        code: input.code,
        status: 'PENDIENTE',
        subtotalCents: subtotal.cents,
        discountCents: discount.cents,
        totalCents: total.cents,
        createdAt: new Date(),
        confirmedAt: null,
      },
      input.items,
    )
  }

  get canConfirm(): boolean {
    return this.props.status === 'PENDIENTE'
  }

  get canCancel(): boolean {
    return this.props.status !== 'CANCELADO'
  }
}
