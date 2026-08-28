import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("Rutas no encontradas", () => {
  it("responde 404 con JSON cuando la ruta no existe", async () => {
    const app = createApp();

    const response = await request(app).get("/no-existe");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });
});
