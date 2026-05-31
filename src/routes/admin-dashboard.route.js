import { Router } from "express";
import {
  getAdminOrders,
  getAdminOverview,
  getAdminSales,
} from "../modules/dashboard/admin-dashboard.controller.js";
import { requireRole, verifyToken } from "../middlewares/login.auth.middleware.js";

export const router = Router();

router.use(verifyToken);
router.use(requireRole(["admin"]));

router.get("/overview", getAdminOverview);
router.get("/orders", getAdminOrders);
router.get("/sales", getAdminSales);
