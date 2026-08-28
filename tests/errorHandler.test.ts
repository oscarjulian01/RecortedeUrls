import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { errorHandler } from "../src/middleware/errorHandler.js";

function buildAppThatThrows() {
  const app = express();
  app.get("/boom", () => {
    throw new Error("fallo interno de prueba");
  });
  app.use(errorHandler);
  return app;
}

describe("errorHandler", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it("responde 500 con mensaje genérico en producción, sin caer el servidor", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.NODE_ENV = "production";
    const app = buildAppThatThrows();

    const response = await request(app).get("/boom");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Error interno del servidor" });
  });

  it("incluye el mensaje del error en desarrollo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.NODE_ENV = "development";
    const app = buildAppThatThrows();

    const response = await request(app).get("/boom");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "fallo interno de prueba" });
  });
});
