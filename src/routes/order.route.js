import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderDetails,
  updateOrderStatus,
  getAllOrders,
} from "../modules/orders/order.controller.js";
import { verifyToken, requireRole } from "../middlewares/login.auth.middleware.js";

export const router = Router();

// ทุก Request ใน Order ต้องผ่านการตรวจสอบ Token
router.use(verifyToken);

router.get("/", getMyOrders);
router.get("/all", requireRole(["admin"]), getAllOrders); // เฉพาะ Admin
router.get("/:orderId", getOrderDetails);
router.post("/checkout", createOrder);

// สำหรับ Mock Payment หรือ Admin อัปเดตสถานะ
router.patch("/status/:orderId", updateOrderStatus); 
