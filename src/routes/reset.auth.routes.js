import { Router } from "express";
import { resetPassword } from "../modules/forgotpass/reset.auth.controllers.js"; 
import { resetPasswordLimiter } from "../middlewares/reset.auth.middleware.js"; 
import { redisClient } from "../config/redis.js";

export const router = Router();

router.get("/reset-password/status", async (req, res) => {
  try {
    const clientIp = req.ip;
    const redisKey = `rl:${clientIp}`; 
    const ttlSeconds = await redisClient.ttl(redisKey);

    if (ttlSeconds > 0) {
      return res.json({ isBlocked: true, timeLeft: ttlSeconds });
    }
    return res.json({ isBlocked: false, timeLeft: 0 });
  } catch (error) {
    res.status(500).json({ message: "ไม่สามารถตรวจสอบสถานะได้" });
  }
});

router.put("/reset-password", resetPasswordLimiter, resetPassword);