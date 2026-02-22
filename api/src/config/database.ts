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
    CREATE TABLE IF NOT EXISTS user (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      name        TEXT,
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS edition (
      year            INTEGER PRIMARY KEY,
      committee       TEXT,
      committee_img   TEXT,
      presenters      TEXT,
      presenters_img  TEXT
    );

    CREATE TABLE IF NOT EXISTS category (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      name_welsh  TEXT
    );

    CREATE TABLE IF NOT EXISTS competition (
      id          TEXT    PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES category(id),
      description TEXT,
      language    TEXT    CHECK(language IN ('Cymraeg','Castellano','English','Aleman','Polaco','Frances','Portugues','Italiano','Otro')),
      year        INTEGER NOT NULL REFERENCES edition(year),
      type        TEXT    NOT NULL CHECK(type IN ('GRU','IND')),
      extra_text  TEXT,
      rank        INTEGER DEFAULT 0,
      preliminary TEXT
    );

    CREATE TABLE IF NOT EXISTS participant (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      surname      TEXT,
      document_id  TEXT,
      birth_date   TEXT,
      nationality  TEXT,
      residence    TEXT,
      email        TEXT,
      phone        TEXT,
      type         TEXT    NOT NULL CHECK(type IN ('IND','GRU')),
      active       INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS registration (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL REFERENCES participant(id),
      competition_id TEXT    NOT NULL REFERENCES competition(id),
      pseudonym      TEXT,
      registered_at  TEXT    DEFAULT (date('now')),
      year           INTEGER NOT NULL,
      dropped        INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS work (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL REFERENCES participant(id),
      display_name   TEXT,
      placement      TEXT    CHECK(placement IN ('1','2','3','mencion',NULL)),
      competition_id TEXT    NOT NULL REFERENCES competition(id),
      title          TEXT    NOT NULL,
      date           TEXT    DEFAULT (datetime('now')),
      video_url      TEXT,
      photo_url      TEXT
    );

    CREATE TABLE IF NOT EXISTS upload (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      year        INTEGER NOT NULL REFERENCES edition(year),
      filename    TEXT    NOT NULL,
      description TEXT
    );
  `);
}
