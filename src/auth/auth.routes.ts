import { Router } from "express";
import { AuthError, isValidEmail, login, register } from "./auth.service.js";

const MIN_PASSWORD_LENGTH = 8;

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  const { email, password, name } = req.body as {
    email?: unknown;
    password?: unknown;
    name?: unknown;
  };

  if (typeof email !== "string" || !isValidEmail(email)) {
    res.status(400).json({ error: "Debes enviar un email válido." });
    return;
  }

  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    res
      .status(400)
      .json({ error: `El password debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` });
    return;
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Debes enviar un nombre." });
    return;
  }

  try {
    const result = register({ email, password, name });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    throw err;
  }
});

authRouter.post("/login", (req, res) => {
  const { email, password } = req.body as { email?: unknown; password?: unknown };

  if (typeof email !== "string" || !isValidEmail(email)) {
    res.status(400).json({ error: "Debes enviar un email válido." });
    return;
  }

  if (typeof password !== "string" || password.length === 0) {
    res.status(400).json({ error: "Debes enviar un password." });
    return;
  }

  try {
    const result = login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    throw err;
  }
});
