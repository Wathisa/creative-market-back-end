import { Router } from "express";
import {
  getDashboardMe,
  getMyHistory,
  getMyOrders,
  getMyStatus,
  getMySummary,
} from "../modules/dashboard/user-dashboard.controller.js";
import { verifyToken } from "../middlewares/login.auth.middleware.js";

export const router = Router();

router.use(verifyToken);

router.get("/me", getDashboardMe);
router.get("/my-summary", getMySummary);
router.get("/my-status", getMyStatus);
router.get("/my-history", getMyHistory);
router.get("/my-orders", getMyOrders);
