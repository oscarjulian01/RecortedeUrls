import { db } from "../db/connection.js";

export interface UserRecord {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
}

function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    createdAt: row.created_at,
  };
}

export function insertUser(email: string, passwordHash: string, name: string): UserRecord {
  const row = db
    .prepare(
      "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?) RETURNING id, email, password_hash, name, created_at",
    )
    .get(email, passwordHash, name) as UserRow;

  return toUserRecord(row);
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const row = db
    .prepare("SELECT id, email, password_hash, name, created_at FROM users WHERE email = ?")
    .get(email) as UserRow | undefined;

  return row ? toUserRecord(row) : undefined;
}
