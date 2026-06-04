import { Router } from "express";
// ปรับ path ตรง forgotpass เป็นตัวพิมพ์เล็กตาม main เพื่อป้องกัน Error บน Server
import { forgotPassword } from "../modules/forgotpass/forgot.auth.controller.js"; 
import { forgotPasswordLimiter } from "../middlewares/forgot.auth.middleware.js"; 
import { redisClient } from "../config/redis.js";

export const router = Router();

// API เช็คสถานะ Rate Limit ของพี่ตรี (สำคัญมาก ห้ามลบ เพราะ Frontend ต้องใช้)
router.get("/forgot-password/status", async (req, res) => {
  try {
    const clientIp = req.ip;
    const redisKey = `rl:${clientIp}`; 

    const currentCount = await redisClient.get(redisKey);
    const ttlSeconds = await redisClient.ttl(redisKey); 

    if (currentCount && parseInt(currentCount, 10) >= 6 && ttlSeconds > 0) {
      return res.json({ 
        isBlocked: true, 
        timeLeft: ttlSeconds 
      });
    }

    return res.json({ isBlocked: false, timeLeft: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "ไม่สามารถตรวจสอบสถานะได้" });
  }
});

router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);