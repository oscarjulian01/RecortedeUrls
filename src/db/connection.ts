import Database from "better-sqlite3";
import { config } from "../config.js";

function createSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      original_url TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);

    CREATE TABLE IF NOT EXISTS clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url_id INTEGER NOT NULL REFERENCES urls(id),
      clicked_at TEXT NOT NULL DEFAULT (datetime('now')),
      ip TEXT,
      user_agent TEXT,
      referrer TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_clicks_url_id_clicked_at ON clicks(url_id, clicked_at);
  `);
}

export function createConnection(filename: string): Database.Database {
  const database = new Database(filename);
  createSchema(database);
  return database;
}

export function resetDatabase(database: Database.Database): void {
  // clicks depende de urls, y urls depende de users: hay que borrar en ese orden por las FKs.
  database.exec("DELETE FROM clicks; DELETE FROM urls; DELETE FROM users;");
}

// Vitest define process.env.VITEST: usamos BD en memoria en tests para no
// persistir datos entre ejecuciones ni tocar el archivo real de desarrollo.
export const db = createConnection(process.env.VITEST ? ":memory:" : config.dbName);
