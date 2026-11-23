/** Error de aplicación con status HTTP. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const notFound = (code: string, message: string) => new AppError(404, code, message)
export const conflict = (code: string, message: string) => new AppError(409, code, message)
export const unprocessable = (code: string, message: string) => new AppError(422, code, message)
export const unauthorized = (message = 'Credenciales inválidas') =>
  new AppError(401, 'UNAUTHORIZED', message)
