import { Router } from "express";
import { resetPassword } from "../modules/forgotpass/reset.auth.controllers.js"; 

export const router = Router();

// ใช้ PUT เพื่อรองรับการอัปเดตข้อมูลรหัสผ่านใหม่จากหน้าบ้าน
router.put("/reset-password", resetPassword);