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

const VALID_IDIOMAS = new Set([
  'Cymraeg', 'Castellano', 'English', 'Aleman', 'Polaco', 'Frances',
  'Portugues', 'Italiano', 'Otro',
]);

function safeIdioma(v: string | number | null): string | null {
  if (v === null) return null;
  const s = String(v);
  return VALID_IDIOMAS.has(s) ? s : 'Otro';
}

function safePuesto(v: string | number | null): string | null {
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

function ensureCurrentYearInscriptos(db: ReturnType<typeof getDb>): void {
  const currentYear = new Date().getFullYear();
  const currentCountRow = db
    .prepare('SELECT COUNT(*) as n FROM inscriptos WHERE anio_insc = ?')
    .get(currentYear) as { n: number };

  if ((currentCountRow?.n ?? 0) > 0) {
    console.log(`ℹ Current year (${currentYear}) already has inscriptos`);
    return;
  }

  const sourceYearRow = db
    .prepare('SELECT MAX(anio_insc) as y FROM inscriptos WHERE anio_insc < ?')
    .get(currentYear) as { y: number | null };

  if (!sourceYearRow?.y) {
    console.warn(`⚠ No prior inscriptos found to backfill ${currentYear}`);
    db.prepare('INSERT OR IGNORE INTO anio (id_anio) VALUES (?)').run(currentYear);
    return;
  }

  const sourceYear = Number(sourceYearRow.y);
  db.prepare('INSERT OR IGNORE INTO anio (id_anio) VALUES (?)').run(currentYear);

  const sourceComps = db.prepare(`
    SELECT id_comp, categoria, descripcion, idioma, grupind, rank, preliminar
    FROM competencia
    WHERE fk_anio = ?
    ORDER BY rank ASC, id_comp ASC
  `).all(sourceYear) as Array<{
    id_comp: string;
    categoria: number;
    descripcion: string | null;
    idioma: string | null;
    grupind: 'IND' | 'GRU';
    rank: number | null;
    preliminar: string | null;
  }>;

  if (sourceComps.length === 0) {
    console.warn(`⚠ Year ${sourceYear} has no competencias to clone into ${currentYear}`);
    return;
  }

  const compInsert = db.prepare(`
    INSERT OR IGNORE INTO competencia (id_comp, categoria, descripcion, idioma, fk_anio, grupind, rank, preliminar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const compIdMap = new Map<string, string>();
  for (const comp of sourceComps) {
    const clonedCompId = `${currentYear}-${comp.id_comp}`;
    compInsert.run(
      clonedCompId,
      comp.categoria,
      comp.descripcion,
      safeIdioma(comp.idioma),
      currentYear,
      comp.grupind,
      comp.rank ?? 0,
      comp.preliminar,
    );
    compIdMap.set(comp.id_comp, clonedCompId);
  }

  const sourceInscriptos = db.prepare(`
    SELECT fk_persona, fk_comp, seudonimo, fecha_inscrip, baja
    FROM inscriptos
    WHERE anio_insc = ?
  `).all(sourceYear) as Array<{
    fk_persona: number;
    fk_comp: string;
    seudonimo: string | null;
    fecha_inscrip: string | null;
    baja: number | null;
  }>;

  if (sourceInscriptos.length === 0) {
    console.warn(`⚠ Year ${sourceYear} has no inscriptos to clone into ${currentYear}`);
    return;
  }

  const inscInsert = db.prepare(`
    INSERT INTO inscriptos (fk_persona, fk_comp, seudonimo, fecha_inscrip, anio_insc, baja)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  for (const row of sourceInscriptos) {
    const clonedCompId = compIdMap.get(String(row.fk_comp));
    if (!clonedCompId) continue;
    inscInsert.run(
      row.fk_persona,
      clonedCompId,
      row.seudonimo ?? null,
      dateInYear(row.fecha_inscrip, currentYear),
      currentYear,
      row.baja ?? 0,
    );
    inserted++;
  }

  console.log(
    `✓ Backfilled ${inserted} current-year inscriptos for ${currentYear} (source year: ${sourceYear})`
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

  // ── anio ──────────────────────────────────────────────────────────────
  // Columns: Id_anio, comision, presentadores, coordinadores, jurado, balance, extra, comisionimg, presentadoresimg
  {
    const block = extractBlock(sql, 'anio');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO anio (id_anio, comision, comision_img, presentadores, presentadores_img)
         VALUES (?, ?, ?, ?, ?)`
      );
      let count = 0;
      for (const r of rows) {
        insert.run(cell(r[0]), cell(r[1]) || null, cell(r[7]) || null, cell(r[2]) || null, cell(r[8]) || null);
        count++;
      }
      console.log(`✓ anio: ${count} rows`);
    } else {
      console.warn('⚠ No anio block found');
    }
  }

  // ── categoria ─────────────────────────────────────────────────────────
  // Columns: id_cat, nombre, nomcym, descripcion
  {
    // Clear seeded categories first to avoid conflicts
    db.prepare('DELETE FROM categoria').run();
    const block = extractBlock(sql, 'categoria');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO categoria (id_cat, nombre, nomcym) VALUES (?, ?, ?)`
      );
      let count = 0;
      for (const r of rows) {
        insert.run(cell(r[0]), cell(r[1]), cell(r[2]) || null);
        count++;
      }
      console.log(`✓ categoria: ${count} rows`);
    } else {
      console.warn('⚠ No categoria block found');
    }
  }

  // ── competencia ───────────────────────────────────────────────────────
  // Columns: id_comp, categoria, descripcion, fk_anio, idioma, rank, preliminar, pre_lugar, grupind, extra
  {
    const block = extractBlock(sql, 'competencia');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO competencia (id_comp, categoria, descripcion, idioma, fk_anio, grupind, rank, preliminar)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      let count = 0;
      for (const r of rows) {
        const idComp = String(cell(r[0])); // convert int→text
        const categoria = cell(r[1]) as number;
        const descripcion = cell(r[2]);
        const fkAnio = cell(r[3]) as number;
        const idioma = safeIdioma(cell(r[4]));
        const rank = cell(r[5]) ?? 0;
        const grupind = String(cell(r[8]) || 'IND').trim() || 'IND';
        const preliminar = String(cell(r[6]) ?? 0);

        // Ensure the anio exists (might be from a year with no data row)
        db.prepare('INSERT OR IGNORE INTO anio (id_anio) VALUES (?)').run(fkAnio);

        insert.run(idComp, categoria, descripcion, idioma, fkAnio, grupind, rank, preliminar);
        count++;
      }
      console.log(`✓ competencia: ${count} rows`);
    } else {
      console.warn('⚠ No competencia block found');
    }
  }

  // ── persona ───────────────────────────────────────────────────────────
  // Columns: id_persona, DNI, Nombre, Apellido, direccion, FechaNac, Nacionalidad, Residencia, Email, Telefono, Telefono2, tipo
  {
    const block = extractBlock(sql, 'persona');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO persona (id_persona, nombre, apellido, dni, fecha_nac, nacionalidad, residencia, email, telefono, tipo)
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
      console.log(`✓ persona: ${count} rows`);
    } else {
      console.warn('⚠ No persona block found');
    }
  }

  // ── inscriptos ────────────────────────────────────────────────────────
  // Columns: id_inscripto, fk_persona, fk_comp, seudonimo, fechainscrip, anio_insc, baja
  {
    const block = extractBlock(sql, 'inscriptos');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO inscriptos (id_inscripto, fk_persona, fk_comp, seudonimo, fecha_inscrip, anio_insc, baja)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      let count = 0;
      for (const r of rows) {
        const fkComp = String(cell(r[2])); // int→text
        insert.run(cell(r[0]), cell(r[1]), fkComp, cell(r[3]), cell(r[4]), cell(r[5]), cell(r[6]) ?? 0);
        count++;
      }
      console.log(`✓ inscriptos: ${count} rows`);
    } else {
      console.warn('⚠ No inscriptos block found');
    }
  }

  // ── Obra ──────────────────────────────────────────────────────────────
  // Columns: id_obra, fk_particip, puesto, competencia, Nombre, fecha, VIDEOURLS, PHOTOURLS
  {
    const block = extractBlock(sql, 'Obra');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO obra (id_obra, fk_particip, puesto, competencia, nom_obra, fecha, video_urls, photo_urls)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      let count = 0;
      for (const r of rows) {
        const competencia = String(cell(r[3])); // int→text
        const nomObra = cell(r[4]) as string | null;
        insert.run(
          cell(r[0]),
          cell(r[1]),
          safePuesto(cell(r[2])),
          competencia,
          nomObra || '(sin título)',
          cell(r[5]),
          cell(r[6]) || null,
          cell(r[7]) || null,
        );
        count++;
      }
      console.log(`✓ obra: ${count} rows`);
    } else {
      console.warn('⚠ No Obra block found');
    }
  }

  // ── subidas ───────────────────────────────────────────────────────────
  // Columns: id_subida, archivo, descripcion, id_anio
  {
    const block = extractBlock(sql, 'subidas');
    if (block) {
      const rows = parseInsertValues(block);
      const insert = db.prepare(
        `INSERT OR IGNORE INTO subida (id, id_anio, archivo, descripcion) VALUES (?, ?, ?, ?)`
      );
      let count = 0;
      for (const r of rows) {
        const idAnio = cell(r[3]) as number;
        if (idAnio > 0) { // skip id_anio=0 (invalid)
          db.prepare('INSERT OR IGNORE INTO anio (id_anio) VALUES (?)').run(idAnio);
          insert.run(cell(r[0]), idAnio, cell(r[1]) || '', cell(r[2]));
          count++;
        }
      }
      console.log(`✓ subida: ${count} rows`);
    } else {
      console.warn('⚠ No subidas block found');
    }
  }

});

try {
  migrate();
  ensureCurrentYearInscriptos(db);
  db.pragma('foreign_keys = ON');
  console.log('\nMigration complete ✓');
} catch (err) {
  db.pragma('foreign_keys = ON');
  console.error('Migration failed:', err);
  process.exit(1);
}
