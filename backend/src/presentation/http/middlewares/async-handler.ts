import type { NextFunction, Request, RequestHandler, Response } from 'express'

/** Express 4 no captura rejections de handlers async. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next)
  }
}
