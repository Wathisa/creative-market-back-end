import express from "express";
import { checkEmail, registerUser } from "../modules/register/user.controller.js";
import { registerLimiter } from "../middlewares/user.middleware.js";
import { redisClient } from "../config/redis.js";

export const router = express.Router();

// 1. วางตัวนับที่ check-email (ด่านแรกสุด) 
// ทำให้ทุกการกดปุ่มหน้าเว็บ จะถูกนับ 1 ครั้งเสมอ ไม่ว่าอีเมลจะซ้ำหรือไม่
router.get("/check-email", registerLimiter, checkEmail);

// 2. ปล่อยผ่านที่ด่านสอง
// เอาตัวนับออกจาก register เพื่อป้องกันไม่ให้มันบวกคะแนนเบิ้ลเวลาข้อมูลถูกต้อง
router.post("/register", registerUser);

router.get("/register/status", async (req, res) => {
  try {
    const clientIp = req.ip;
    const redisKey = `rl:register:${clientIp}`; 
    
    const currentCount = await redisClient.get(redisKey);
    const ttlSeconds = await redisClient.ttl(redisKey);

    // ถ้ากดเกิน 7 ครั้ง (คือครั้งที่ 8) ให้ส่งสถานะบล็อกกลับไป
    if (currentCount && parseInt(currentCount, 10) > 7 && ttlSeconds > 0) {
      return res.json({ isBlocked: true, timeLeft: ttlSeconds });
    }
    
    return res.json({ isBlocked: false, timeLeft: 0 });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
});