import { db } from "../db/connection.js";

export interface UrlRecord {
  id: number;
  code: string;
  originalUrl: string;
  userId: number;
  createdAt: string;
}

interface UrlRow {
  id: number;
  code: string;
  original_url: string;
  user_id: number;
  created_at: string;
}

function toUrlRecord(row: UrlRow): UrlRecord {
  return {
    id: row.id,
    code: row.code,
    originalUrl: row.original_url,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export function insertUrl(code: string, originalUrl: string, userId: number): UrlRecord {
  const row = db
    .prepare(
      "INSERT INTO urls (code, original_url, user_id) VALUES (?, ?, ?) RETURNING id, code, original_url, user_id, created_at",
    )
    .get(code, originalUrl, userId) as UrlRow;

  return toUrlRecord(row);
}

export function findUrlByCode(code: string): UrlRecord | undefined {
  const row = db
    .prepare("SELECT id, code, original_url, user_id, created_at FROM urls WHERE code = ?")
    .get(code) as UrlRow | undefined;

  return row ? toUrlRecord(row) : undefined;
}

export function listUrls(): UrlRecord[] {
  const rows = db
    .prepare("SELECT id, code, original_url, user_id, created_at FROM urls ORDER BY id DESC")
    .all() as UrlRow[];

  return rows.map(toUrlRecord);
}

export function deleteUrlById(id: number): void {
  db.prepare("DELETE FROM urls WHERE id = ?").run(id);
}
