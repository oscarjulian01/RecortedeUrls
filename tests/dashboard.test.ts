import type { Express } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { db, resetDatabase } from "../src/db/connection.js";

async function registerUser(
  app: Express,
  email = "owner@example.com",
): Promise<{ token: string; userId: number }> {
  const response = await request(app)
    .post("/auth/register")
    .send({ email, password: "clave-segura-123", name: "Owner" });

  return { token: response.body.token as string, userId: response.body.user.id as number };
}

function insertClickAt(urlId: number, clickedAt: string): void {
  db.prepare("INSERT INTO clicks (url_id, clicked_at) VALUES (?, ?)").run(urlId, clickedAt);
}

describe("GET /dashboard", () => {
  beforeEach(() => {
    resetDatabase(db);
  });

  it("responde 401 si no hay token", async () => {
    const app = createApp();

    const response = await request(app).get("/dashboard");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  it("devuelve totales y tendencia en cero cuando el usuario no tiene URLs", async () => {
    const app = createApp();
    const { token } = await registerUser(app);

    const response = await request(app).get("/dashboard").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.totals).toEqual({ accountClicks: 0, urls: [] });
    expect(response.body.trend.rangeDays).toBe(30);
    expect(response.body.trend.points).toHaveLength(30);
    expect(response.body.trend.points.every((point: { clicks: number }) => point.clicks === 0)).toBe(
      true,
    );
  });

  it("devuelve totales y tendencia correctos cuando el usuario tiene URLs y clicks", async () => {
    const app = createApp();
    const { token } = await registerUser(app);

    const created = await request(app)
      .post("/urls")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "https://con-clicks.example.com" });

    const urlId = created.body.id as number;
    const today = new Date().toISOString().slice(0, 10);

    insertClickAt(urlId, `${today}T10:00:00`);
    insertClickAt(urlId, `${today}T11:00:00`);
    insertClickAt(urlId, "2000-01-01T00:00:00");

    const response = await request(app).get("/dashboard").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.totals.accountClicks).toBe(3);
    expect(response.body.totals.urls).toEqual([
      {
        code: created.body.code,
        originalUrl: "https://con-clicks.example.com",
        totalClicks: 3,
      },
    ]);

    const todayPoint = response.body.trend.points.find(
      (point: { date: string }) => point.date === today,
    );
    expect(todayPoint.clicks).toBe(2);

    const totalTrendClicks = response.body.trend.points.reduce(
      (sum: number, point: { clicks: number }) => sum + point.clicks,
      0,
    );
    expect(totalTrendClicks).toBe(2);
  });

  it("registra un click al redirigir y se refleja en el dashboard", async () => {
    const app = createApp();
    const { token } = await registerUser(app);
    const created = await request(app)
      .post("/urls")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "https://redirigida.example.com" });

    await request(app).get(`/${created.body.code}`);

    const response = await request(app).get("/dashboard").set("Authorization", `Bearer ${token}`);

    expect(response.body.totals.accountClicks).toBe(1);
  });
});