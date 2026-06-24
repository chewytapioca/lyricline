import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Invalid request parameters',
      code:  'VALIDATION_ERROR',
      issues: err.flatten().fieldErrors,
    });
  }

  // Known operational errors
  if (err instanceof Error) {
    console.error('[server]', err.message);

    // Don't leak internal details in production
    return res.status(500).json({
      error: process.env['NODE_ENV'] === 'development' ? err.message : 'Internal server error',
      code:  'INTERNAL_ERROR',
    });
  }

  return res.status(500).json({ error: 'Unknown error', code: 'UNKNOWN_ERROR' });
};
