import type { Response } from 'express'

export function validatedBody<T>(res: Response): T {
  return res.locals.body as T
}

export function validatedQuery<T>(res: Response): T {
  return res.locals.query as T
}

export function validatedParams<T>(res: Response): T {
  return res.locals.params as T
}
