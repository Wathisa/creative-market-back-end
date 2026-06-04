import express from "express";
import { checkEmail, registerUser } from "../modules/register/user.controller.js";
import { registerLimiter } from "../middlewares/user.middleware.js";
import { redisClient } from "../config/redis.js";

export const router = express.Router();

router.get("/check-email", registerLimiter, checkEmail);
router.post("/register", registerLimiter, registerUser);

router.get("/register/status", async (req, res) => {
  try {
    const clientIp = req.ip;
    const redisKey = `rl:register:${clientIp}`; 
    
    const currentCount = await redisClient.get(redisKey);
    const ttlSeconds = await redisClient.ttl(redisKey);

    if (currentCount && parseInt(currentCount, 10) > 7 && ttlSeconds > 0) {
      return res.json({ isBlocked: true, timeLeft: ttlSeconds });
    }
    
    return res.json({ isBlocked: false, timeLeft: 0 });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
});

router.post("/register", registerLimiter, registerUser);