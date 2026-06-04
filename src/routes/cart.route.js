import { Router } from "express";

import {
  addItemToCart,
  clearCart,
  getCart,
  updateCartItem,
  removeCartItem,
} from "../modules/cart/cart.controller.js";
import { verifyToken } from "../middlewares/login.auth.middleware.js";

export const router = Router();

// ทุก Request ใน Cart ต้องผ่านการตรวจสอบ Token
router.use(verifyToken);

router.get("/", getCart);
router.post("/add", addItemToCart);
router.patch("/update", updateCartItem);
router.delete("/remove/:productId", removeCartItem);
router.delete("/clear", clearCart);