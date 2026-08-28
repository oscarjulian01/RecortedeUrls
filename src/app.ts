import express, { type Express } from "express";
import { authRouter } from "./auth/auth.routes.js";
import { dashboardRouter } from "./dashboard/dashboard.routes.js";
import { healthRouter } from "./health/health.routes.js";
import { redirectRouter, urlsRouter } from "./urls/urls.routes.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";

export function createApp(): Express {
  const app = express();

  app.use(requestLogger);
  app.use(express.json());
  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/urls", urlsRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/", redirectRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
