import { Router } from "express";

import {
  addItemToCart,
  clearCart,
  getCart,
  updateCartItem,
  removeCartItem,
} from "../modules/cart/cart.controller.js";

export const router = Router();

router.get("/", getCart);
router.post("/add", addItemToCart);
router.put("/update", updateCartItem);
router.delete("/remove/:productId", removeCartItem);
router.delete("/clear", clearCart);



