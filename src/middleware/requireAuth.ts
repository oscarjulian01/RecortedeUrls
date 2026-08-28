import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface AuthenticatedUser {
  id: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const BEARER_PREFIX = "Bearer ";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("Authorization");

  if (!header?.startsWith(BEARER_PREFIX)) {
    res.status(401).json({ error: "Falta el token de autenticación." });
    return;
  }

  const token = header.slice(BEARER_PREFIX.length);

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    if (typeof decoded === "string" || typeof decoded.sub !== "number") {
      res.status(401).json({ error: "Token inválido o expirado." });
      return;
    }

    req.user = { id: decoded.sub };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado." });
  }
}
