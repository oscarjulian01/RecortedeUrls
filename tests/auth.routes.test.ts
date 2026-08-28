import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { db, resetDatabase } from "../src/db/connection.js";

describe("Rutas de autenticación", () => {
  beforeEach(() => {
    resetDatabase(db);
  });

  describe("POST /auth/register", () => {
    it("registra un usuario y devuelve el usuario (sin passwordHash) y el token", async () => {
      const app = createApp();

      const response = await request(app)
        .post("/auth/register")
        .send({ email: "ana@example.com", password: "clave-segura-123", name: "Ana" });

      expect(response.status).toBe(201);
      expect(response.body.user).toMatchObject({ email: "ana@example.com", name: "Ana" });
      expect(response.body.user).not.toHaveProperty("passwordHash");
      expect(response.body.user).not.toHaveProperty("password_hash");
      expect(typeof response.body.token).toBe("string");
    });

    it("responde 400 si el email no es válido", async () => {
      const app = createApp();

      const response = await request(app)
        .post("/auth/register")
        .send({ email: "no-es-un-email", password: "clave-segura-123", name: "Ana" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("responde 400 si el password es muy corto", async () => {
      const app = createApp();

      const response = await request(app)
        .post("/auth/register")
        .send({ email: "ana@example.com", password: "corto", name: "Ana" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("responde 400 si falta el nombre", async () => {
      const app = createApp();

      const response = await request(app)
        .post("/auth/register")
        .send({ email: "ana@example.com", password: "clave-segura-123" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("responde 409 si el email ya está registrado", async () => {
      const app = createApp();
      await request(app)
        .post("/auth/register")
        .send({ email: "ana@example.com", password: "clave-segura-123", name: "Ana" });

      const response = await request(app)
        .post("/auth/register")
        .send({ email: "ana@example.com", password: "otra-clave-123", name: "Otra Ana" });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      const app = createApp();
      await request(app)
        .post("/auth/register")
        .send({ email: "ana@example.com", password: "clave-segura-123", name: "Ana" });
    });

    it("inicia sesión con credenciales correctas y devuelve usuario y token", async () => {
      const app = createApp();

      const response = await request(app)
        .post("/auth/login")
        .send({ email: "ana@example.com", password: "clave-segura-123" });

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({ email: "ana@example.com", name: "Ana" });
      expect(typeof response.body.token).toBe("string");
    });

    it("responde 401 con password incorrecto", async () => {
      const app = createApp();

      const response = await request(app)
        .post("/auth/login")
        .send({ email: "ana@example.com", password: "password-incorrecto" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("responde 401 con email inexistente", async () => {
      const app = createApp();

      const response = await request(app)
        .post("/auth/login")
        .send({ email: "no-existe@example.com", password: "clave-segura-123" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("inicia sesión aunque el email se envíe en mayúsculas", async () => {
      const app = createApp();

      const response = await request(app)
        .post("/auth/login")
        .send({ email: "ANA@EXAMPLE.COM", password: "clave-segura-123" });

      expect(response.status).toBe(200);
      expect(typeof response.body.token).toBe("string");
    });
  });
});
