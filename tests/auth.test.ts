import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it } from "vitest";
import { config } from "../src/config.js";
import { AuthError, login, register } from "../src/auth/auth.service.js";
import { db, resetDatabase } from "../src/db/connection.js";

describe("Servicio de autenticación", () => {
  beforeEach(() => {
    resetDatabase(db);
  });

  describe("register", () => {
    it("registra un usuario y devuelve un JWT válido con expiración de 24 horas", () => {
      const result = register({
        email: "ana@example.com",
        password: "clave-segura-123",
        name: "Ana",
      });

      expect(typeof result.token).toBe("string");

      const decoded = jwt.verify(result.token, config.jwtSecret) as jwt.JwtPayload;
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp! - decoded.iat!).toBe(24 * 60 * 60);
    });

    it("falla si el email ya está registrado", () => {
      register({ email: "ana@example.com", password: "clave-segura-123", name: "Ana" });

      expect(() =>
        register({ email: "ana@example.com", password: "otra-clave", name: "Otra Ana" }),
      ).toThrow(AuthError);
    });

    it("falla si el email ya está registrado con distinta capitalización", () => {
      register({ email: "ana@example.com", password: "clave-segura-123", name: "Ana" });

      expect(() =>
        register({ email: "ANA@EXAMPLE.COM", password: "otra-clave", name: "Otra Ana" }),
      ).toThrow(AuthError);
    });
  });

  describe("login", () => {
    beforeEach(() => {
      register({ email: "ana@example.com", password: "clave-segura-123", name: "Ana" });
    });

    it("inicia sesión con credenciales correctas y devuelve un JWT", () => {
      const result = login({ email: "ana@example.com", password: "clave-segura-123" });

      expect(typeof result.token).toBe("string");
      const decoded = jwt.verify(result.token, config.jwtSecret) as jwt.JwtPayload;
      expect(decoded.sub).toBeDefined();
    });

    it("falla con password incorrecto", () => {
      expect(() => login({ email: "ana@example.com", password: "password-incorrecto" })).toThrow(
        AuthError,
      );
    });

    it("falla con email inexistente", () => {
      expect(() =>
        login({ email: "no-existe@example.com", password: "clave-segura-123" }),
      ).toThrow(AuthError);
    });

    it("inicia sesión aunque el email se envíe en mayúsculas", () => {
      const result = login({ email: "ANA@EXAMPLE.COM", password: "clave-segura-123" });

      expect(typeof result.token).toBe("string");
    });
  });
});
