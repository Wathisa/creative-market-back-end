import { Router } from "express";
import { loginUser, checkUser, logoutUser } from "../modules/login/login.auth.controllers.js";
import authMiddleware from "../middlewares/login.auth.middleware.js";

const { verifyToken: authUser } = authMiddleware;

export const router = Router();

// ตรวจสอบการ Login ของผู้ใช้
router.post("/login", loginUser);

// ตรวจสอบเซสชันของผู้ใช้
router.get("/me", authUser, checkUser);

// ออกจากระบบ
router.post("/logout", logoutUser);