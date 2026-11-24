import type { RequestHandler } from 'express'
import type { z } from 'zod'

export interface ValidationSchemas {
  body?: z.ZodType
  query?: z.ZodType
  params?: z.ZodType
}

/** Valida y deja los datos en res.locals (body/query/params). */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, res, next) => {
    try {
      if (schemas.params) res.locals.params = schemas.params.parse(req.params)
      if (schemas.query) res.locals.query = schemas.query.parse(req.query)
      if (schemas.body) res.locals.body = schemas.body.parse(req.body)
      next()
    } catch (error) {
      next(error)
    }
  }
}
