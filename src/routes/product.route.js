import { upload } from "../middlewares/upload.js";

import express from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getProductBySlug,
} from "../modules/products/product.controller.js";

export const router = express.Router();

//ถ้าวางไว้ข้างล่าง Mongoose จะเข้าใจผิดว่าคำว่า "categories" คือ "ID" ของสินค้าตัวหนึ่ง แล้วมันจะพยายามเอาคำว่า "categories" ไปค้นหาในฐานข้อมูล ซึ่งจะทำให้เกิด Error
router.get("/categories", getCategories);

router.get("/", getProducts);

router.post("/", upload.single("image"), createProduct);

router.put("/:id", updateProduct);

router.delete("/:id", deleteProduct);

router.get("/:slug", getProductBySlug);