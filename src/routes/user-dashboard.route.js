import { Router } from "express";
import {
  deleteMyAddress,
  getDashboardMe,
  getMyAddress,
  getMyHistory,
  getMyOrders,
  getMyStatus,
  getMySummary,
  upsertMyAddress,
} from "../modules/dashboard/user-dashboard.controller.js";
import { verifyToken } from "../middlewares/login.auth.middleware.js";

export const router = Router();

router.use(verifyToken);

router.get("/me", getDashboardMe);
router.get("/my-summary", getMySummary);
router.get("/my-status", getMyStatus);
router.get("/my-history", getMyHistory);
router.get("/my-orders", getMyOrders);
router.get("/my-address", getMyAddress);
router.put("/my-address", upsertMyAddress);
router.delete("/my-address", deleteMyAddress);