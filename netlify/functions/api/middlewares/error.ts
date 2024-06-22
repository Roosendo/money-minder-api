import type { Request, Response, NextFunction } from 'express'
/*
  - This middleware handles errors that occur in the application.
  - A middleware is used instead of a controller because errors can occur
    anywhere in the application, not just in the controllers.
*/
export const errorMiddleware = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong, but it is not your fault' })
}
