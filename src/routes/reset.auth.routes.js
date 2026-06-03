import { Router } from "express";
import { resetPassword } from "../modules/forgotpass/reset.auth.controllers.js"; 
import { resetPasswordLimiter } from "../middlewares/reset.auth.middleware.js"; 

export const router = Router();

// ใช้ PUT เพื่อรองรับการอัปเดตข้อมูลรหัสผ่านใหม่จากหน้าบ้าน
router.put("/reset-password", resetPasswordLimiter, resetPassword);