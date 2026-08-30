import { Request, Response, NextFunction } from 'express';

/**
 * A database constraint violation is a client mistake, not a server fault, but
 * SQLite reports it as a thrown error that used to reach here and become a 500
 * carrying the raw engine message. That made a duplicate competition id a 500
 * while the equivalent duplicate edition was a clean 409, and it leaked schema
 * details (table and column names) to anyone who could provoke one.
 *
 * Constraint errors are now mapped to the status they always meant, with a
 * message describing the problem rather than the engine. Everything else is a
 * genuine fault: the client gets a generic message, the stack still goes to the
 * server log.
 */
interface SqliteError extends Error {
  code?: string;
  /** express.json() and other middleware set this for client-side faults. */
  status?: number;
  statusCode?: number;
  expose?: boolean;
}

interface Mapped {
  status: number;
  error: string;
  code: string;
}

/** SQLite's constraint codes → the HTTP status each has always meant. */
export function mapSqliteError(err: SqliteError): Mapped | null {
  switch (err.code) {
    case 'SQLITE_CONSTRAINT_PRIMARYKEY':
    case 'SQLITE_CONSTRAINT_UNIQUE':
      return {
        status: 409,
        error: 'Ya existe un registro con ese identificador',
        code: 'CONFLICT_DUPLICATE',
      };
    case 'SQLITE_CONSTRAINT_FOREIGNKEY':
      // Both directions land here: referencing something absent, and deleting
      // something still referenced. The client cannot tell them apart from the
      // engine message either, so say what is actionable.
      return {
        status: 409,
        error: 'La operación entra en conflicto con registros relacionados',
        code: 'CONFLICT_REFERENCE',
      };
    case 'SQLITE_CONSTRAINT_NOTNULL':
      return { status: 400, error: 'Falta un campo obligatorio', code: 'VALIDATION_REQUIRED' };
    case 'SQLITE_CONSTRAINT_CHECK':
      return { status: 400, error: 'Un campo tiene un valor no permitido', code: 'VALIDATION_VALUE' };
    default:
      return null;
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err.stack);

  const mapped = mapSqliteError(err as SqliteError);
  if (mapped) {
    res.status(mapped.status).json({ error: mapped.error, code: mapped.code });
    return;
  }

  // Middleware faults that already know they are the client's (a malformed JSON
  // body from express.json() is a 400, not a 500). Keep their status and, since
  // they are safe to expose, their message.
  const e = err as SqliteError;
  const given = e.status ?? e.statusCode;
  if (typeof given === 'number' && given >= 400 && given < 500) {
    res.status(given).json({ error: e.message || 'Solicitud inválida', code: 'BAD_REQUEST' });
    return;
  }

  // Unmapped: a real fault. Detail stays in the log above, not in the response.
  res.status(500).json({ error: 'Error interno del servidor', code: 'INTERNAL' });
}
