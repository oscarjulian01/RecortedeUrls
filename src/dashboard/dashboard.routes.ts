import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getDashboard } from "./dashboard.service.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, (req, res) => {
  res.status(200).json(getDashboard(req.user!.id));
});