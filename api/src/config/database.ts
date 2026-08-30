import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let db: Database.Database | undefined;

/**
 * Resolved lazily, not at module load, so tests can set DB_PATH (or ':memory:')
 * after importing this module.
 */
function resolveDbPath(): string {
  const configured = process.env.DB_PATH || './data/eistedglobal.db';
  return configured === ':memory:' ? ':memory:' : path.resolve(configured);
}

/**
 * The DDL lives in schema.sql so bythfod's mock server can vendor it verbatim
 * and enforce identical constraints. Resolved relative to this file, which works
 * from both src/ (ts-node) and dist/ (compiled) — the build copies it across.
 */
function schemaSql(): string {
  return fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
}

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = resolveDbPath();
    if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    // WAL is meaningless for an in-memory database.
    if (dbPath !== ':memory:') db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(schemaSql());
  }
  return db;
}

/** Close the handle. Safe to call when nothing is open. */
export function closeDb(): void {
  db?.close();
  db = undefined;
}

/** Close and reopen — a fresh schema when DB_PATH is ':memory:'. For tests. */
export function resetDb(): Database.Database {
  closeDb();
  return getDb();
}
