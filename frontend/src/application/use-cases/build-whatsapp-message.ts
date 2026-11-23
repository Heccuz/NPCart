import type { Order, OrderCategorySummary } from '@/domain/entities'
import { formatCents } from '@/domain/money'

const DEFAULT_MAX_LENGTH = 1800

interface Group {
  title: string
  lines: string[]
  offerNote: string | null
}

function groupItems(order: Order, categories: OrderCategorySummary[]): Group[] {
  const summaryByName = new Map(categories.map((category) => [category.categoryName, category]))
  const groups = new Map<string, Group>()

  for (const item of order.items) {
    if (!groups.has(item.categoryName)) {
      groups.set(item.categoryName, { title: item.categoryName, lines: [], offerNote: null })
    }
    groups
      .get(item.categoryName)!
      .lines.push(
        `• ${item.name} (${item.seriesName}) — ${item.qty} x ${formatCents(item.unitPriceCents)}`,
      )
  }

  for (const group of groups.values()) {
    const summary = summaryByName.get(group.title)
    if (summary?.appliedOffer && summary.discountCents > 0) {
      group.offerNote = `  🎁 Oferta ${summary.appliedOffer.minQuantity}+: ${formatCents(summary.appliedOffer.unitPriceCents)} c/u (ahorras ${formatCents(summary.discountCents)})`
    }
  }

  return [...groups.values()]
}

function render(header: string, footer: string, groups: Group[], dropped: number): string {
  const sections = groups
    .filter((group) => group.lines.length > 0)
    .map((group) => {
      const note = group.offerNote ? `\n${group.offerNote}` : ''
      return `\n*${group.title}*\n${group.lines.join('\n')}${note}`
    })

  const droppedNote = dropped > 0 ? `\n…y ${dropped} ítems más` : ''
  return `${header}${sections.join('')}${droppedNote}${footer}`
}

/**
 * Mensaje de WhatsApp del pedido verificable.
 * Si supera el largo práctico de wa.me, colapsa las últimas líneas
 * en "…y N ítems más" conservando totales y ahorro completos.
 */
export function buildWhatsAppMessage(
  order: Order,
  categories: OrderCategorySummary[],
  maxLength = DEFAULT_MAX_LENGTH,
): string {
  const header = `🛒 *Nuevo pedido - NPCart*\n🧾 *Código: ${order.code}*\n`
  const discountLine =
    order.discountCents > 0 ? `Ahorro total: ${formatCents(order.discountCents)}\n` : ''
  const footer = `\n\n${discountLine}*Total: ${formatCents(order.totalCents)}*`

  const groups = groupItems(order, categories)
  let dropped = 0
  let text = render(header, footer, groups, dropped)

  while (text.length > maxLength) {
    const lastWithLines = [...groups].reverse().find((group) => group.lines.length > 0)
    if (!lastWithLines) break
    lastWithLines.lines.pop()
    dropped += 1
    text = render(header, footer, groups, dropped)
  }

  return text
}
