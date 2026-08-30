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
    migratePlacementCheck(db);
  }
  return db;
}

/**
 * Rebuild `work` if it still carries the broken placement constraint.
 *
 * `CHECK(placement IN ('1','2','3','mencion',NULL))` never rejects anything: for
 * a non-match the IN expression is NULL, and a CHECK only rejects on false. The
 * schema is applied with CREATE TABLE IF NOT EXISTS, so fixing schema.sql alone
 * would leave every existing database — including production — unprotected.
 *
 * SQLite cannot ALTER a CHECK, so the table is recreated. Nothing references
 * work(id), which is what makes that safe.
 */
function migratePlacementCheck(db: Database.Database): void {
  const row = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='work'")
    .get() as { sql?: string } | undefined;
  if (!row?.sql || !/placement[^,]*IN\s*\([^)]*NULL/i.test(row.sql)) return;

  const invalid = (
    db.prepare(
      "SELECT COUNT(*) AS n FROM work WHERE placement IS NOT NULL AND placement NOT IN ('1','2','3','mencion')",
    ).get() as { n: number }
  ).n;
  if (invalid > 0) {
    console.warn(
      `[schema] ${invalid} work row(s) hold an invalid placement; leaving the ` +
      'constraint unenforced. Clean them, then restart to complete the migration.',
    );
    return;
  }

  // Reuse the corrected DDL from schema.sql rather than restating it here.
  const ddl = schemaSql().match(/CREATE TABLE IF NOT EXISTS work \([\s\S]*?\n\);/);
  if (!ddl) throw new Error('could not locate the work table DDL in schema.sql');

  db.exec('BEGIN');
  try {
    db.exec(ddl[0].replace('IF NOT EXISTS work (', 'work__migrating ('));
    db.exec('INSERT INTO work__migrating SELECT * FROM work');
    db.exec('DROP TABLE work');
    db.exec('ALTER TABLE work__migrating RENAME TO work');
    db.exec('COMMIT');
    console.log('[schema] rebuilt `work` — the placement constraint now enforces');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
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
