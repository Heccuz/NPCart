const DRIVE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/thumbnail\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/,
  /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
  /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
]

/**
 * Normaliza links de Google Drive a una URL servible en <img>.
 * Espejo del resolver del backend (dos archivos aislados).
 */
export function resolveImageUrl(url: string | null | undefined, width = 800): string {
  const trimmed = url?.trim() ?? ''
  if (!trimmed) return ''

  for (const pattern of DRIVE_ID_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match?.[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w${width}`
    }
  }

  return trimmed
}
