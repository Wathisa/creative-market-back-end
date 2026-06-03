import { Router } from "express";
import { forgotPassword } from "../modules/forgotPass/forgot.auth.controller.js"; 
import { forgotPasswordLimiter } from "../middlewares/forgot.auth.middleware.js"; 
import { redisClient } from "../config/redis.js";

export const router = Router();

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