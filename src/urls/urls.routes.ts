import { Router } from "express";
import { insertClick } from "../clicks/clicks.repository.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  createShortUrl,
  deleteUrl,
  getAllUrls,
  getUrlByCode,
  isValidUrl,
  UrlError,
} from "./urls.service.js";

export const urlsRouter = Router();

urlsRouter.post("/", requireAuth, (req, res) => {
  const { url } = req.body as { url?: unknown };

  if (typeof url !== "string" || !isValidUrl(url)) {
    res.status(400).json({ error: "Debes enviar una URL válida en el campo 'url'." });
    return;
  }

  const created = createShortUrl(url, req.user!.id);
  res.status(201).json(created);
});

urlsRouter.get("/", (_req, res) => {
  res.status(200).json(getAllUrls());
});

urlsRouter.delete("/:code", requireAuth, (req, res) => {
  try {
    deleteUrl(req.params.code, req.user!.id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof UrlError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export const redirectRouter = Router();

redirectRouter.get("/:code", (req, res, next) => {
  const record = getUrlByCode(req.params.code);

  if (!record) {
    next();
    return;
  }

  insertClick(record.id, {
    ip: req.ip,
    userAgent: req.header("user-agent"),
    referrer: req.header("referer"),
  });

  res.redirect(302, record.originalUrl);
});
