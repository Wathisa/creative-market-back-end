import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderDetails,
  updateOrderStatus,
  getAllOrders,
} from "../modules/orders/order.controller.js";
import { verifyToken } from "../middlewares/login.auth.middleware.js";

export const router = Router();

// ทุก Request ใน Order ต้องผ่านการตรวจสอบ Token
router.use(verifyToken);

router.get("/", getMyOrders);
router.get("/all", getAllOrders); // เพิ่ม Route นี้สำหรับ Admin
router.get("/:orderId", getOrderDetails);
router.post("/checkout", createOrder);
router.patch("/status/:orderId", updateOrderStatus); 
