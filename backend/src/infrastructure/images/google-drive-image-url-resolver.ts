import type { IImageUrlResolver } from '../../application/ports/image-url-resolver'

const DRIVE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/thumbnail\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/,
  /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
  /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
]

/**
 * Punto único de cambio para las URLs de imágenes.
 * Normaliza cualquier link de Google Drive al endpoint thumbnail.
 * Los links que no son de Drive pasan tal cual.
 */
export class GoogleDriveImageUrlResolver implements IImageUrlResolver {
  resolve(url: string): string {
    const trimmed = url?.trim() ?? ''
    if (!trimmed) return ''

    for (const pattern of DRIVE_ID_PATTERNS) {
      const match = trimmed.match(pattern)
      if (match?.[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`
      }
    }

    return trimmed
  }
}
