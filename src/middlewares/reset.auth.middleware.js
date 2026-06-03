import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../config/redis.js';

export const resetPasswordLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, 
  max: 7,  
  message: {
    success: false,
    message: "คุณส่งเปลี่ยนรีเซ็ตรหัสผ่านบ่อยเกินไป กรุณารอสักครู่ (ประมาณ 3 นาที) แล้วลองใหม่อีกครั้งครับ"
  },
  standardHeaders: true, 
  legacyHeaders: false, 
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
});