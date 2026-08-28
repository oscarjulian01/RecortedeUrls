import express from "express";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { config } from "../src/config.js";
import { requireAuth } from "../src/middleware/requireAuth.js";
import { notFoundHandler } from "../src/middleware/notFound.js";
import { errorHandler } from "../src/middleware/errorHandler.js";

function buildProtectedApp() {
  const app = express();

  app.get("/protected", requireAuth, (req, res) => {
    res.status(200).json({ userId: req.user?.id });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

function signValidToken(): string {
  return jwt.sign({ sub: 1 }, config.jwtSecret, { expiresIn: "24h" });
}

function signExpiredToken(): string {
  return jwt.sign({ sub: 1 }, config.jwtSecret, { expiresIn: -10 });
}

describe("requireAuth", () => {
  it("deja pasar la petición con un token válido y adjunta el usuario a la request", async () => {
    const app = buildProtectedApp();
    const token = signValidToken();

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: 1 });
  });

  it("responde 401 si no hay token", async () => {
    const app = buildProtectedApp();

    const response = await request(app).get("/protected");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  it("responde 401 si el header Authorization no usa el esquema Bearer", async () => {
    const app = buildProtectedApp();
    const token = signValidToken();

    const response = await request(app).get("/protected").set("Authorization", token);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  it("responde 401 si el token está expirado", async () => {
    const app = buildProtectedApp();
    const token = signExpiredToken();

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  it("responde 401 si el token está malformado", async () => {
    const app = buildProtectedApp();

    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer esto-no-es-un-jwt-valido");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });
});
