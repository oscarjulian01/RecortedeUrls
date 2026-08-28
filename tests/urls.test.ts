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

describe("Módulo urls", () => {
  beforeEach(() => {
    resetDatabase(db);
  });

  describe("POST /urls", () => {
    it("crea una URL corta a partir de una URL válida cuando el usuario está autenticado", async () => {
      const app = createApp();
      const { token } = await registerUser(app);

      const response = await request(app)
        .post("/urls")
        .set("Authorization", `Bearer ${token}`)
        .send({ url: "https://example.com/pagina-muy-larga" });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ originalUrl: "https://example.com/pagina-muy-larga" });
      expect(typeof response.body.code).toBe("string");
      expect(response.body.code.length).toBeGreaterThan(0);
    });

    it("responde 401 si no hay token", async () => {
      const app = createApp();

      const response = await request(app)
        .post("/urls")
        .send({ url: "https://example.com/pagina-muy-larga" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("responde 400 si la URL no es válida", async () => {
      const app = createApp();
      const { token } = await registerUser(app);

      const response = await request(app)
        .post("/urls")
        .set("Authorization", `Bearer ${token}`)
        .send({ url: "no-es-una-url" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("responde 400 si falta el campo url", async () => {
      const app = createApp();
      const { token } = await registerUser(app);

      const response = await request(app)
        .post("/urls")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /urls", () => {
    it("lista las URLs creadas sin requerir autenticación", async () => {
      const app = createApp();
      const { token } = await registerUser(app);
      await request(app)
        .post("/urls")
        .set("Authorization", `Bearer ${token}`)
        .send({ url: "https://uno.example.com" });
      await request(app)
        .post("/urls")
        .set("Authorization", `Bearer ${token}`)
        .send({ url: "https://dos.example.com" });

      const response = await request(app).get("/urls");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((u: { originalUrl: string }) => u.originalUrl)).toEqual(
        expect.arrayContaining(["https://uno.example.com", "https://dos.example.com"]),
      );
    });

    it("responde con una lista vacía cuando no hay URLs", async () => {
      const app = createApp();

      const response = await request(app).get("/urls");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /:code", () => {
    it("redirige a la URL original cuando el código existe, sin requerir autenticación", async () => {
      const app = createApp();
      const { token } = await registerUser(app);
      const created = await request(app)
        .post("/urls")
        .set("Authorization", `Bearer ${token}`)
        .send({ url: "https://destino.example.com" });

      const response = await request(app).get(`/${created.body.code}`);

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe("https://destino.example.com");
    });

    it("responde 404 cuando el código no existe", async () => {
      const app = createApp();

      const response = await request(app).get("/codigo-inexistente");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("DELETE /urls/:code", () => {
    it("borra la URL cuando la pide su propio dueño", async () => {
      const app = createApp();
      const { token } = await registerUser(app);
      const created = await request(app)
        .post("/urls")
        .set("Authorization", `Bearer ${token}`)
        .send({ url: "https://a-borrar.example.com" });

      const response = await request(app)
        .delete(`/urls/${created.body.code}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);

      const afterDelete = await request(app).get(`/${created.body.code}`);
      expect(afterDelete.status).toBe(404);
    });

    it("responde 403 si otro usuario intenta borrarla", async () => {
      const app = createApp();
      const owner = await registerUser(app, "owner@example.com");
      const intruder = await registerUser(app, "intruder@example.com");
      const created = await request(app)
        .post("/urls")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ url: "https://ajena.example.com" });

      const response = await request(app)
        .delete(`/urls/${created.body.code}`)
        .set("Authorization", `Bearer ${intruder.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
    });

    it("responde 401 si no hay token", async () => {
      const app = createApp();
      const { token } = await registerUser(app);
      const created = await request(app)
        .post("/urls")
        .set("Authorization", `Bearer ${token}`)
        .send({ url: "https://sin-token.example.com" });

      const response = await request(app).delete(`/urls/${created.body.code}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("responde 404 si el código no existe", async () => {
      const app = createApp();
      const { token } = await registerUser(app);

      const response = await request(app)
        .delete("/urls/codigo-inexistente")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });
});
