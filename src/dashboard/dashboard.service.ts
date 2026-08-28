import { getDailyTrend, getTotalsByUser } from "../clicks/clicks.repository.js";

const DEFAULT_TREND_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface DashboardTrendPoint {
  date: string;
  clicks: number;
}

export interface DashboardResponse {
  totals: {
    accountClicks: number;
    urls: { code: string; originalUrl: string; totalClicks: number }[];
  };
  trend: {
    rangeDays: number;
    points: DashboardTrendPoint[];
  };
}

function buildDateRange(days: number): string[] {
  const today = new Date();
  const dates: string[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(today.getTime() - offset * MS_PER_DAY);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

export function getDashboard(userId: number, days: number = DEFAULT_TREND_DAYS): DashboardResponse {
  const urlTotals = getTotalsByUser(userId);
  const accountClicks = urlTotals.reduce((sum, url) => sum + url.totalClicks, 0);

  const trendRows = getDailyTrend(userId, days);
  const clicksByDay = new Map(trendRows.map((row) => [row.day, row.clicks]));

  const points = buildDateRange(days).map((date) => ({
    date,
    clicks: clicksByDay.get(date) ?? 0,
  }));

  return {
    totals: {
      accountClicks,
      urls: urlTotals,
    },
    trend: {
      rangeDays: days,
      points,
    },
  };
}