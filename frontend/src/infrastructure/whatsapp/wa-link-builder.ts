const DEFAULT_NUMBER = '51999999999'

export function whatsappNumber(): string {
  return (import.meta.env.VITE_WHATSAPP_NUMBER || DEFAULT_NUMBER).replace(/\D/g, '')
}

export function buildWaLink(text: string): string {
  return `https://wa.me/${whatsappNumber()}?text=${encodeURIComponent(text)}`
}
