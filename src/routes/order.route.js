import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderDetails,
  updateOrderStatus,
} from "../modules/orders/order.controller.js";

export const router = Router();

// ทุกอย่างต้อง Login ก่อน (รอใส่ Middleware ของเพื่อน)
// router.use(protect); 

router.get("/", getMyOrders);
router.get("/:orderId", getOrderDetails);
router.post("/checkout", createOrder);
router.patch("/status/:orderId", updateOrderStatus); // สำหรับปุ่มกดเปลี่ยนสถานะ mock promptpay
