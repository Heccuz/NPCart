import type { RequestHandler } from 'express'
import type { ITokenService } from '../../../application/ports/token-service'
import { AppError } from '../../../application/errors/app-error'

export function requireAdmin(tokens: ITokenService): RequestHandler {
  return (req, res, next) => {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null

    if (!token) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token de administrador requerido'))
      return
    }

    const payload = tokens.verify(token)
    if (!payload) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token inválido o expirado'))
      return
    }

    res.locals.admin = payload
    next()
  }
}
