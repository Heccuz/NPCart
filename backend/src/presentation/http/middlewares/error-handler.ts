import type { ErrorRequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { AppError } from '../../../application/errors/app-error'
import { DomainError } from '../../../domain/errors/domain-error'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos inválidos',
        details: error.flatten(),
      },
    })
    return
  }

  if (error instanceof AppError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } })
    return
  }

  if (error instanceof DomainError) {
    res.status(422).json({ error: { code: error.code, message: error.message } })
    return
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({
        error: { code: 'DUPLICATE_RECORD', message: 'Ya existe un registro con esos datos' },
      })
      return
    }
    if (error.code === 'P2025') {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registro no encontrado' } })
      return
    }
  }

  console.error('[api] Error inesperado:', error)
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
  })
}
