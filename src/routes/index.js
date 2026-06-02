import { Router } from "express";
import { router as productsRoutes } from "./product.route.js";
import { router as cartRoutes } from "./cart.route.js";
import { router as userRoutes } from "./user.route.js";
import { router as authRoutes } from "./login.auth.routes.js";
import { router as orderRoutes } from "./order.route.js";
import { router as userDashboardRoutes } from "./user-dashboard.route.js";
import { router as adminDashboardRoutes } from "./admin-dashboard.route.js";

export const router = Router();

router.use("/products", productsRoutes);
router.use("/cart", cartRoutes);
router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/orders", orderRoutes);
router.use("/user-dashboard", userDashboardRoutes);
router.use("/admin-dashboard", adminDashboardRoutes);