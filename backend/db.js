import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'data', 'alumni.db'));

// WAL — лучшая конкурентность при параллельных запросах
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS graduates (
    id          INTEGER PRIMARY KEY,
    name        TEXT    NOT NULL,
    photo       TEXT,
    photoConsent INTEGER NOT NULL DEFAULT 0,
    grp         TEXT    NOT NULL DEFAULT '',
    graduationYear INTEGER NOT NULL,
    job         TEXT    NOT NULL DEFAULT '',
    gender      TEXT    NOT NULL DEFAULT 'Мужской',
    facts       TEXT    NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY,
    login       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'member',
    graduateId  INTEGER REFERENCES graduates(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS groups_list (
    id   INTEGER PRIMARY KEY,
    name TEXT    NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS requests (
    id             INTEGER PRIMARY KEY,
    type           TEXT    NOT NULL,
    status         TEXT    NOT NULL DEFAULT 'pending',
    createdAt      TEXT    NOT NULL,
    resolvedAt     TEXT,
    submittedBy    INTEGER,
    graduateId     INTEGER,
    name           TEXT,
    photo          TEXT,
    photoConsent   INTEGER DEFAULT 0,
    grp            TEXT    DEFAULT '',
    groupComment   TEXT,
    graduationYear INTEGER,
    job            TEXT    DEFAULT '',
    gender         TEXT    DEFAULT 'Мужской',
    facts          TEXT    DEFAULT '[]',
    passwordHash   TEXT,
    passwordPlain  TEXT,
    message        TEXT    DEFAULT ''
  );
`);

// Добавляем passwordPlain, если столбец ещё не существует (миграция для существующих БД)
try {
  db.exec("ALTER TABLE requests ADD COLUMN passwordPlain TEXT");
} catch (_) {
  // Столбец уже есть — игнорируем
}

// Преобразует строку БД → объект выпускника
export function gradFromRow(row) {
  if (!row) return null;
  return {
    id:             row.id,
    name:           row.name,
    photo:          row.photo || null,
    photoConsent:   row.photoConsent === 1,
    group:          row.grp || '',
    graduationYear: row.graduationYear,
    job:            row.job || '',
    gender:         row.gender || 'Мужской',
    facts:          JSON.parse(row.facts || '[]'),
  };
}

// Преобразует строку БД → объект заявки
export function requestFromRow(row) {
  if (!row) return null;
  const obj = {
    id:             row.id,
    type:           row.type,
    status:         row.status,
    createdAt:      row.createdAt,
    submittedBy:    row.submittedBy,
    graduateId:     row.graduateId,
    name:           row.name,
    photo:          row.photo || null,
    photoConsent:   row.photoConsent === 1,
    group:          row.grp || '',
    graduationYear: row.graduationYear,
    job:            row.job || '',
    gender:         row.gender || 'Мужской',
    facts:          JSON.parse(row.facts || '[]'),
    message:        row.message || '',
  };
  if (row.resolvedAt)    obj.resolvedAt    = row.resolvedAt;
  if (row.groupComment)  obj.groupComment  = row.groupComment;
  if (row.passwordPlain) obj.passwordPlain = row.passwordPlain;
  return obj;
}

export default db;
