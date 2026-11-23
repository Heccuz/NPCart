import { DomainError } from '../errors/domain-error'

/** Stock siempre finito: entero >= 0. 0 = agotado. */
export class Stock {
  private constructor(public readonly units: number) {}

  static from(units: number): Stock {
    if (!Number.isInteger(units) || units < 0) {
      throw new DomainError('INVALID_STOCK', `Stock inválido: ${units} (entero >= 0)`)
    }
    return new Stock(units)
  }

  get isAvailable(): boolean {
    return this.units > 0
  }

  decrease(quantity: number): Stock {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new DomainError('INVALID_QUANTITY', `Cantidad inválida: ${quantity}`)
    }
    return Stock.from(Math.max(0, this.units - quantity))
  }
}
