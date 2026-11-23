const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
})

/** Formatea céntimos a soles: 1250 → "S/ 12.50". Solo en presentación. */
export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100)
}
