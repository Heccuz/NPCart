/** Puerto para normalizar URLs de imagen (Google Drive hoy, storage propio mañana). */
export interface IImageUrlResolver {
  resolve(url: string): string
}
