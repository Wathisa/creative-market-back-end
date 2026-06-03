import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../config/redis.js'; 

export const forgotPasswordLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, 
  max: 6, 
  message: {
    success: false,
    message: "ส่งคำขอรีเซ็ตรหัสผ่านบ่อยเกินไป กรุณารอสักครู่ (ประมาณ 3 นาที) แล้วลองใหม่ครับ"
  },
  standardHeaders: true, 
  legacyHeaders: false, 
  
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
});