export type NodeEnv = "development" | "production";

export interface Config {
  readonly port: number;
  readonly nodeEnv: NodeEnv;
  readonly dbName: string;
  readonly jwtSecret: string;
}

function resolveNodeEnv(): NodeEnv {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function loadConfig(): Config {
  const nodeEnv = resolveNodeEnv();
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const dbName = process.env.DB_NAME;
  const jwtSecret = process.env.JWT_SECRET;

  if (nodeEnv === "production" && !dbName) {
    throw new Error(
      "La variable de entorno DB_NAME es obligatoria cuando NODE_ENV=production.",
    );
  }

  if (nodeEnv === "production" && !jwtSecret) {
    throw new Error(
      "La variable de entorno JWT_SECRET es obligatoria cuando NODE_ENV=production.",
    );
  }

  return {
    port,
    nodeEnv,
    dbName: dbName ?? "snap.db",
    jwtSecret: jwtSecret ?? "dev-secret-please-change",
  };
}

export const config: Config = loadConfig();
