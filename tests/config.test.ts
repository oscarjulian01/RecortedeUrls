import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("config", () => {
  const keys = ["PORT", "NODE_ENV", "DB_NAME", "JWT_SECRET"] as const;
  const original: Partial<Record<(typeof keys)[number], string>> = {};

  beforeEach(() => {
    for (const key of keys) {
      original[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of keys) {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    }
  });

  it("usa los valores por defecto en desarrollo cuando no hay variables de entorno", () => {
    const config = loadConfig();

    expect(config).toEqual({
      port: 3000,
      nodeEnv: "development",
      dbName: "snap.db",
      jwtSecret: "dev-secret-please-change",
    });
  });

  it("lanza un error claro si falta DB_NAME en producción", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "un-secreto-de-prueba";

    expect(() => loadConfig()).toThrow(/DB_NAME/);
  });

  it("lanza un error claro si falta JWT_SECRET en producción", () => {
    process.env.NODE_ENV = "production";
    process.env.DB_NAME = "snap_prod.db";

    expect(() => loadConfig()).toThrow(/JWT_SECRET/);
  });

  it("usa los valores del entorno en producción cuando están definidos", () => {
    process.env.NODE_ENV = "production";
    process.env.DB_NAME = "snap_prod.db";
    process.env.PORT = "8080";
    process.env.JWT_SECRET = "un-secreto-de-prueba";

    const config = loadConfig();

    expect(config).toEqual({
      port: 8080,
      nodeEnv: "production",
      dbName: "snap_prod.db",
      jwtSecret: "un-secreto-de-prueba",
    });
  });
});
