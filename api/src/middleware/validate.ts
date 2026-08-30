import { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

/**
 * Validates a request body and replaces it with the parsed value, so handlers
 * receive data that has already been checked and defaulted.
 *
 * The error shape deliberately matches the rest of the API — `{ error, code }`
 * — with the offending fields added. Previously a bad value reached SQLite and
 * came back as a constraint failure, which told the caller that something was
 * wrong but not what.
 */
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields = result.error.issues.map(i => ({
        field: i.path.join('.') || '(body)',
        message: i.message,
      }));
      res.status(400).json({
        error: `Datos inválidos: ${fields.map(f => f.field).join(', ')}`,
        code: 'VALIDATION_FAILED',
        fields,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
