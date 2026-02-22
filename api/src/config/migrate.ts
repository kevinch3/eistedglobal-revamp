/**
 * Migration script — imports data from the legacy MySQL SQL dump
 * into the new SQLite database.
 *
 * Usage:  npm run migrate
 * Source: /home/kevinch3/Documentos/Dev/web/2017/SQL/eistedglobal.sql
 */
import fs from 'fs';
import { getDb } from './database';

// ── helpers ────────────────────────────────────────────────────────────────

/** Parse MySQL INSERT VALUES block into arrays of raw cell strings.
 *  Uses a proper state machine to handle quoted strings with ) and newlines inside. */
function parseInsertValues(block: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = block.length;

  while (i < len) {
    // Find the opening ( of a row
    while (i < len && block[i] !== '(') i++;
    if (i >= len) break;
    i++; // skip '('

    // Now collect characters until the matching closing )
    let rowStr = '';
    let depth = 1;
    let inStr = false;

    while (i < len && depth > 0) {
      const ch = block[i];
      if (ch === "'" && !inStr) {
        inStr = true;
        rowStr += ch;
      } else if (ch === "'" && inStr) {
        rowStr += ch;
        // escaped '' ?
        if (block[i + 1] === "'") {
          rowStr += "'";
          i++;
        } else {
          inStr = false;
        }
      } else if (ch === '(' && !inStr) {
        depth++;
        rowStr += ch;
      } else if (ch === ')' && !inStr) {
        depth--;
        if (depth > 0) rowStr += ch;
      } else {
        rowStr += ch;
      }
      i++;
    }

    if (rowStr.trim()) {
      rows.push(splitRow(rowStr));
    }
  }
  return rows;
}

/** Split a row string like `1, 'hello', NULL, '2012-01-01'` into cells */
function splitRow(row: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inStr = false;
  let i = 0;
  while (i < row.length) {
    const ch = row[i];
    if (ch === "'" && !inStr) {
      inStr = true;
      current += ch;
    } else if (ch === "'" && inStr) {
      // Handle escaped '' in MySQL
      if (row[i + 1] === "'") {
        current += "''";
        i += 2;
        continue;
      }
      inStr = false;
      current += ch;
    } else if (ch === ',' && !inStr) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
    i++;
  }
  cells.push(current.trim());
  return cells;
}

/** Convert a raw SQL cell string to a JS value */
function cell(raw: string): string | number | null {
  const v = raw.trim();
  if (v === 'NULL') return null;
  if (v.startsWith("'") && v.endsWith("'")) {
    // strip quotes and unescape ''
    return v.slice(1, -1).replace(/''/g, "'");
  }
  const num = Number(v);
  return isNaN(num) ? v : num;
}

/** Extract the VALUES rows from an INSERT statement for a given table.
 *  Scans forward character-by-character past the VALUES keyword so semicolons
 *  inside quoted strings don't prematurely terminate the block. */
function extractBlock(sql: string, table: string): string | null {
  // Find "INSERT INTO `table`"
  const header = `INSERT INTO \`${table}\``;
  const start = sql.indexOf(header);
  if (start === -1) return null;

  // Find "VALUES" after the header
  const valuesIdx = sql.indexOf('VALUES', start);
  if (valuesIdx === -1) return null;

  // Scan from after "VALUES " to the terminating semicolon outside quotes
  let i = valuesIdx + 6; // skip "VALUES"
  while (i < sql.length && sql[i] !== '(') i++; // skip whitespace to first (

  // Collect until we hit a ; that is NOT inside quotes
  let block = '';
  let inStr = false;
  while (i < sql.length) {
    const ch = sql[i];
    if (ch === "'" && !inStr) {
      inStr = true;
      block += ch;
    } else if (ch === "'" && inStr) {
      block += ch;
      if (sql[i + 1] === "'") { block += "'"; i++; } // escaped ''
      else inStr = false;
    } else if (ch === ';' && !inStr) {
      break;
    } else {
      block += ch;
    }
    i++;
  }
  return block;
}

const VALID_LANGUAGES = new Set([
  'Cymraeg', 'Castellano', 'English', 'Aleman', 'Polaco', 'Frances',
  'Portugues', 'Italiano', 'Otro',
]);

function safeLanguage(v: string | number | null): string | null {
  if (v === null) return null;
  const s = String(v);
  return VALID_LANGUAGES.has(s) ? s : 'Otro';
}

function safePlacement(v: string | number | null): string | null {
  if (v === null || v === '') return null;
  const s = String(v).trim();
  return ['1', '2', '3', 'mencion'].includes(s) ? s : null;
}

function dateInYear(dateRaw: unknown, year: number): string {
  if (typeof dateRaw !== 'string') return `${year}-01-15`;
  const date = dateRaw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return `${year}${date.slice(4)}`;
  return `${year}-01-15`;
}

function ensureCurrentYearRegistrations(db: ReturnType<typeof getDb>): void {
  const currentYear = new Date().getFullYear();
  const currentCountRow = db
    .prepare('SELECT COUNT(*) as n FROM registration WHERE year = ?')
    .get(currentYear) as { n: number };

  if ((currentCountRow?.n ?? 0) > 0) {
    console.log(`ℹ Current year (${currentYear}) already has registrations`);
    return;
  }

  const sourceYearRow = db
    .prepare('SELECT MAX(year) as y FROM registration WHERE year < ?')
    .get(currentYear) as { y: number | null };

  if (!sourceYearRow?.y) {
    console.warn(`⚠ No prior registrations found to backfill ${currentYear}`);
    db.prepare('INSERT OR IGNORE INTO edition (year) VALUES (?)').run(currentYear);
    return;
  }

  const sourceYear = Number(sourceYearRow.y);
  db.prepare('INSERT OR IGNORE INTO edition (year) VALUES (?)').run(currentYear);

  const sourceComps = db.prepare(`
    SELECT id, category_id, description, language, type, rank, preliminary
    FROM competition
    WHERE year = ?
    ORDER BY rank ASC, id ASC
  `).all(sourceYear) as Array<{
    id: string;
    category_id: number;
    description: string | null;
    language: string | null;
    type: 'IND' | 'GRU';
    rank: number | null;
    preliminary: string | null;
  }>;

  if (sourceComps.length === 0) {
    console.warn(`⚠ Year ${sourceYear} has no competitions to clone into ${currentYear}`);
    return;
  }

  const compInsert = db.prepare(`
    INSERT OR IGNORE INTO competition (id, category_id, description, language, year, type, rank, preliminary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const compIdMap = new Map<string, string>();
  for (const comp of sourceComps) {
    const clonedCompId = `${currentYear}-${comp.id}`;
    compInsert.run(
      clonedCompId,
      comp.category_id,
      comp.description,
      safeLanguage(comp.language),
      currentYear,
      comp.type,
      comp.rank ?? 0,
      comp.preliminary,
    );
    compIdMap.set(comp.id, clonedCompId);
  }

  const sourceRegistrations = db.prepare(`
    SELECT participant_id, competition_id, pseudonym, registered_at, dropped
    FROM registration
    WHERE year = ?
  `).all(sourceYear) as Array<{
    participant_id: number;
    competition_id: string;
    pseudonym: string | null;
    registered_at: string | null;
    dropped: number | null;
  }>;

  if (sourceRegistrations.length === 0) {
    console.warn(`⚠ Year ${sourceYear} has no registrations to clone into ${currentYear}`);
    return;
  }

  const regInsert = db.prepare(`
    INSERT INTO registration (participant_id, competition_id, pseudonym, registered_at, year, dropped)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  for (const row of sourceRegistrations) {
    const clonedCompId = compIdMap.get(String(row.competition_id));
    if (!clonedCompId) continue;
    regInsert.run(
      row.participant_id,
      clonedCompId,
      row.pseudonym ?? null,
      dateInYear(row.registered_at, currentYear),
      currentYear,
      row.dropped ?? 0,
    );
    inserted++;
  }

  console.log(
    `✓ Backfilled ${inserted} current-year registrations for ${currentYear} (source year: ${sourceYear})`
  );
}

// ── main ───────────────────────────────────────────────────────────────────

const SQL_FILE = '/home/kevinch3/Documentos/Dev/web/2017/SQL/eistedglobal.sql';

console.log('Reading SQL dump…');
const sql = fs.readFileSync(SQL_FILE, 'latin1');

const db = getDb();

// Disable FK checks during migration so orphan rows from old data don't fail
db.pragma('foreign_keys = OFF');

// Wrap everything in a single transaction for speed
const migrate = db.transaction(() => {

  // ── anio → edition ────────────────────────────────────────────────────
  // Columns: Id_anio, comision, presentadores, coordinadores, jurado, balance, extra, comisionimg, presentadoresimg
  {
    const block = extractBlock(sql, 'anio');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO edition (year, committee, committee_img, presenters, presenters_img)
         VALUES (?, ?, ?, ?, ?)`
      );
      let count = 0;
      for (const r of rows) {
        insert.run(cell(r[0]), cell(r[1]) || null, cell(r[7]) || null, cell(r[2]) || null, cell(r[8]) || null);
        count++;
      }
      console.log(`✓ edition: ${count} rows`);
    } else {
      console.warn('⚠ No anio block found');
    }
  }

  // ── categoria → category ──────────────────────────────────────────────
  // Columns: id_cat, nombre, nomcym, descripcion
  {
    // Clear seeded categories first to avoid conflicts
    db.prepare('DELETE FROM category').run();
    const block = extractBlock(sql, 'categoria');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO category (id, name, name_welsh) VALUES (?, ?, ?)`
      );
      let count = 0;
      for (const r of rows) {
        insert.run(cell(r[0]), cell(r[1]), cell(r[2]) || null);
        count++;
      }
      console.log(`✓ category: ${count} rows`);
    } else {
      console.warn('⚠ No categoria block found');
    }
  }

  // ── competencia → competition ─────────────────────────────────────────
  // Columns: id_comp, categoria, descripcion, fk_anio, idioma, rank, preliminar, pre_lugar, grupind, extra
  {
    const block = extractBlock(sql, 'competencia');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO competition (id, category_id, description, language, year, type, rank, preliminary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      let count = 0;
      for (const r of rows) {
        const id         = String(cell(r[0])); // convert int→text
        const categoryId = cell(r[1]) as number;
        const description = cell(r[2]);
        const year       = cell(r[3]) as number;
        const language   = safeLanguage(cell(r[4]));
        const rank       = cell(r[5]) ?? 0;
        const type       = String(cell(r[8]) || 'IND').trim() || 'IND';
        const preliminary = String(cell(r[6]) ?? 0);

        // Ensure the edition exists
        db.prepare('INSERT OR IGNORE INTO edition (year) VALUES (?)').run(year);

        insert.run(id, categoryId, description, language, year, type, rank, preliminary);
        count++;
      }
      console.log(`✓ competition: ${count} rows`);
    } else {
      console.warn('⚠ No competencia block found');
    }
  }

  // ── persona → participant ─────────────────────────────────────────────
  // Columns: id_persona, DNI, Nombre, Apellido, direccion, FechaNac, Nacionalidad, Residencia, Email, Telefono, Telefono2, tipo
  {
    const block = extractBlock(sql, 'persona');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO participant (id, name, surname, document_id, birth_date, nationality, residence, email, phone, type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      let count = 0;
      for (const r of rows) {
        insert.run(
          cell(r[0]),   // id_persona
          cell(r[2]),   // Nombre
          cell(r[3]),   // Apellido
          cell(r[1]),   // DNI
          cell(r[5]),   // FechaNac
          cell(r[6]),   // Nacionalidad
          cell(r[7]),   // Residencia
          cell(r[8]),   // Email
          cell(r[9]),   // Telefono
          cell(r[11]),  // tipo
        );
        count++;
      }
      console.log(`✓ participant: ${count} rows`);
    } else {
      console.warn('⚠ No persona block found');
    }
  }

  // ── inscriptos → registration ─────────────────────────────────────────
  // Columns: id_inscripto, fk_persona, fk_comp, seudonimo, fechainscrip, anio_insc, baja
  {
    const block = extractBlock(sql, 'inscriptos');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO registration (id, participant_id, competition_id, pseudonym, registered_at, year, dropped)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      let count = 0;
      for (const r of rows) {
        const competitionId = String(cell(r[2])); // int→text
        insert.run(cell(r[0]), cell(r[1]), competitionId, cell(r[3]), cell(r[4]), cell(r[5]), cell(r[6]) ?? 0);
        count++;
      }
      console.log(`✓ registration: ${count} rows`);
    } else {
      console.warn('⚠ No inscriptos block found');
    }
  }

  // ── Obra → work ───────────────────────────────────────────────────────
  // Columns: id_obra, fk_particip, puesto, competencia, Nombre, fecha, VIDEOURLS, PHOTOURLS
  {
    const block = extractBlock(sql, 'Obra');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO work (id, participant_id, placement, competition_id, title, date, video_url, photo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      let count = 0;
      for (const r of rows) {
        const competitionId = String(cell(r[3])); // int→text
        const title = cell(r[4]) as string | null;
        insert.run(
          cell(r[0]),
          cell(r[1]),
          safePlacement(cell(r[2])),
          competitionId,
          title || '(sin título)',
          cell(r[5]),
          cell(r[6]) || null,
          cell(r[7]) || null,
        );
        count++;
      }
      console.log(`✓ work: ${count} rows`);
    } else {
      console.warn('⚠ No Obra block found');
    }
  }

  // ── subidas → upload ──────────────────────────────────────────────────
  // Columns: id_subida, archivo, descripcion, id_anio
  {
    const block = extractBlock(sql, 'subidas');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO upload (id, year, filename, description) VALUES (?, ?, ?, ?)`
      );
      let count = 0;
      for (const r of rows) {
        const year = cell(r[3]) as number;
        if (year > 0) { // skip year=0 (invalid)
          db.prepare('INSERT OR IGNORE INTO edition (year) VALUES (?)').run(year);
          insert.run(cell(r[0]), year, cell(r[1]) || '', cell(r[2]));
          count++;
        }
      }
      console.log(`✓ upload: ${count} rows`);
    } else {
      console.warn('⚠ No subidas block found');
    }
  }

});

try {
  migrate();
  ensureCurrentYearRegistrations(db);
  db.pragma('foreign_keys = ON');
  console.log('\nMigration complete ✓');
} catch (err) {
  db.pragma('foreign_keys = ON');
  console.error('Migration failed:', err);
  process.exit(1);
}
