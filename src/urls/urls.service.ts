import { randomBytes } from "node:crypto";
import {
  deleteUrlById,
  findUrlByCode,
  insertUrl,
  listUrls,
  type UrlRecord,
} from "./urls.repository.js";

const CODE_BYTES = 6;
const MAX_ATTEMPTS = 5;

export class UrlError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

function generateCode(): string {
  return randomBytes(CODE_BYTES).toString("base64url");
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function createShortUrl(originalUrl: string, userId: number): UrlRecord {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateCode();
    if (!findUrlByCode(code)) {
      return insertUrl(code, originalUrl, userId);
    }
  }

  throw new Error("No se pudo generar un código corto único, intenta de nuevo.");
}

export function getUrlByCode(code: string): UrlRecord | undefined {
  return findUrlByCode(code);
}

export function getAllUrls(): UrlRecord[] {
  return listUrls();
}

export function deleteUrl(code: string, requestingUserId: number): void {
  const url = findUrlByCode(code);

  if (!url) {
    throw new UrlError("No existe una URL con ese código.", 404);
  }

  if (url.userId !== requestingUserId) {
    throw new UrlError("No tienes permiso para borrar esta URL.", 403);
  }

  deleteUrlById(url.id);
}
