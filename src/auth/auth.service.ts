import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { findUserByEmail, insertUser } from "./auth.repository.js";

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = "24h";

export class AuthError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthResult {
  user: PublicUser;
  token: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateToken(userId: number): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: JWT_EXPIRES_IN });
}

function toPublicUser(user: { id: number; email: string; name: string; createdAt: string }): PublicUser {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export function isValidEmail(value: string): boolean {
  const atIndex = value.indexOf("@");
  if (atIndex <= 0 || atIndex !== value.lastIndexOf("@")) {
    return false;
  }

  const localPart = value.slice(0, atIndex);
  const domainPart = value.slice(atIndex + 1);
  const dotIndex = domainPart.indexOf(".");

  return (
    !/\s/.test(localPart) &&
    dotIndex > 0 &&
    dotIndex < domainPart.length - 1 &&
    !/\s/.test(domainPart)
  );
}

export function register({ email, password, name }: RegisterInput): AuthResult {
  const normalizedEmail = normalizeEmail(email);

  if (findUserByEmail(normalizedEmail)) {
    throw new AuthError("Ya existe un usuario con ese email.", 409);
  }

  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  const user = insertUser(normalizedEmail, passwordHash, name);

  return { user: toPublicUser(user), token: generateToken(user.id) };
}

export function login({ email, password }: LoginInput): AuthResult {
  const normalizedEmail = normalizeEmail(email);
  const user = findUserByEmail(normalizedEmail);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    throw new AuthError("Credenciales inválidas.", 401);
  }

  return { user: toPublicUser(user), token: generateToken(user.id) };
}
