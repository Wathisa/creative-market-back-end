import { Router } from "express";
import { loginUser, checkUser, logoutUser } from "../modules/login/login.auth.controllers.js";
import authMiddleware from "../middlewares/login.auth.middleware.js";
import { redisClient } from "../config/redis.js";
import { loginLimiter } from "../middlewares/login.limiter.js"; // Import ตัวนี้เพิ่ม

const { verifyToken: authUser } = authMiddleware;

export const router = Router();

// ตรวจสอบการ Login ของผู้ใช้ (ใช้ limiter คั่นกลาง)
router.post("/login", loginLimiter, loginUser);

router.get("/status", async (req, res) => {
  try {
    const redisKey = `rl:login:${req.ip}`;
    // ใช้ ttl() เพื่อดึงเวลาที่เหลือจริงจาก Redis
    const ttl = await redisClient.ttl(redisKey);
    
    // ถ้า ttl เป็น -1 (ไม่มีวันหมดอายุ) หรือ -2 (ไม่มี Key) ให้ส่ง 0
    // ถ้ามีเวลาเหลือ ให้ส่งค่า ttl นั้นกลับไป
    res.json({ timeLeft: ttl > 0 ? ttl : 0 });
  } catch (err) {
    res.json({ timeLeft: 0 });
  }
});




// ตรวจสอบเซสชันของผู้ใช้
router.get("/me", authUser, checkUser);

// ออกจากระบบ
router.post("/logout", logoutUser);