import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = path.resolve(process.env.DB_PATH || './data/eistedglobal.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuario (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      nombre      TEXT,
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS anio (
      id_anio          INTEGER PRIMARY KEY,
      comision         TEXT,
      comision_img     TEXT,
      presentadores    TEXT,
      presentadores_img TEXT
    );

    CREATE TABLE IF NOT EXISTS categoria (
      id_cat  INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre  TEXT NOT NULL,
      nomcym  TEXT
    );

    CREATE TABLE IF NOT EXISTS competencia (
      id_comp    TEXT    PRIMARY KEY,
      categoria  INTEGER NOT NULL REFERENCES categoria(id_cat),
      descripcion TEXT,
      idioma     TEXT    CHECK(idioma IN ('Cymraeg','Castellano','English','Aleman','Polaco','Frances','Portugues','Italiano','Otro')),
      fk_anio    INTEGER NOT NULL REFERENCES anio(id_anio),
      grupind    TEXT    NOT NULL CHECK(grupind IN ('GRU','IND')),
      xt_texto   TEXT,
      rank       INTEGER DEFAULT 0,
      preliminar TEXT
    );

    CREATE TABLE IF NOT EXISTS persona (
      id_persona   INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre       TEXT    NOT NULL,
      apellido     TEXT,
      dni          TEXT,
      fecha_nac    TEXT,
      nacionalidad TEXT,
      residencia   TEXT,
      email        TEXT,
      telefono     TEXT,
      tipo         TEXT    NOT NULL CHECK(tipo IN ('IND','GRU')),
      activo       INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS inscriptos (
      id_inscripto  INTEGER PRIMARY KEY AUTOINCREMENT,
      fk_persona    INTEGER NOT NULL REFERENCES persona(id_persona),
      fk_comp       TEXT    NOT NULL REFERENCES competencia(id_comp),
      seudonimo     TEXT,
      fecha_inscrip TEXT    DEFAULT (date('now')),
      anio_insc     INTEGER NOT NULL,
      baja          INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS obra (
      id_obra      INTEGER PRIMARY KEY AUTOINCREMENT,
      fk_particip  INTEGER NOT NULL REFERENCES persona(id_persona),
      mod_particip TEXT,
      puesto       TEXT    CHECK(puesto IN ('1','2','3','mencion',NULL)),
      competencia  TEXT    NOT NULL REFERENCES competencia(id_comp),
      nom_obra     TEXT    NOT NULL,
      fecha        TEXT    DEFAULT (datetime('now')),
      video_urls   TEXT,
      photo_urls   TEXT
    );

    CREATE TABLE IF NOT EXISTS subida (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      id_anio      INTEGER NOT NULL REFERENCES anio(id_anio),
      archivo      TEXT    NOT NULL,
      descripcion  TEXT
    );
  `);

  // Incremental migrations — safe to run on existing DBs
  try { db.exec(`ALTER TABLE persona ADD COLUMN activo INTEGER NOT NULL DEFAULT 1`); } catch { /* already exists */ }
}
