import { DomainError } from '../errors/domain-error'

/** Dinero como céntimos enteros. Nunca floats. */
export class Money {
  private constructor(public readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new DomainError('INVALID_MONEY', `Importe inválido: ${cents} (céntimos enteros >= 0)`)
    }
    return new Money(cents)
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents)
  }

  multiply(quantity: number): Money {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new DomainError('INVALID_QUANTITY', `Cantidad inválida: ${quantity}`)
    }
    return Money.fromCents(this.cents * quantity)
  }

  equals(other: Money): boolean {
    return this.cents === other.cents
  }

  get isZero(): boolean {
    return this.cents === 0
  }
}
