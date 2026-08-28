import { db } from "../db/connection.js";

export interface ClickMeta {
  ip?: string;
  userAgent?: string;
  referrer?: string;
}

export interface UrlTotals {
  code: string;
  originalUrl: string;
  totalClicks: number;
}

export interface DailyTrendPoint {
  day: string;
  clicks: number;
}

interface UrlTotalsRow {
  code: string;
  original_url: string;
  total_clicks: number;
}

interface DailyTrendRow {
  day: string;
  clicks: number;
}

export function insertClick(urlId: number, meta: ClickMeta): void {
  db.prepare(
    "INSERT INTO clicks (url_id, ip, user_agent, referrer) VALUES (?, ?, ?, ?)",
  ).run(urlId, meta.ip ?? null, meta.userAgent ?? null, meta.referrer ?? null);
}

export function getTotalsByUser(userId: number): UrlTotals[] {
  const rows = db
    .prepare(
      `SELECT urls.code AS code, urls.original_url AS original_url, COUNT(clicks.id) AS total_clicks
       FROM urls
       LEFT JOIN clicks ON clicks.url_id = urls.id
       WHERE urls.user_id = ?
       GROUP BY urls.id
       ORDER BY urls.id DESC`,
    )
    .all(userId) as UrlTotalsRow[];

  return rows.map((row) => ({
    code: row.code,
    originalUrl: row.original_url,
    totalClicks: row.total_clicks,
  }));
}

export function getDailyTrend(userId: number, days: number): DailyTrendPoint[] {
  const rows = db
    .prepare(
      `SELECT date(clicks.clicked_at) AS day, COUNT(*) AS clicks
       FROM clicks
       JOIN urls ON urls.id = clicks.url_id
       WHERE urls.user_id = ? AND clicks.clicked_at >= datetime('now', ?)
       GROUP BY day
       ORDER BY day`,
    )
    .all(userId, `-${days} days`) as DailyTrendRow[];

  return rows.map((row) => ({ day: row.day, clicks: row.clicks }));
}