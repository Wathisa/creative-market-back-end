import { redisClient } from '../config/redis.js';

export const loginLimiter = async (req, res, next) => {
  try {
    if (!redisClient?.isOpen) return next();

    const clientIp = req.ip;
    const redisKey = `rl:login:${clientIp}`;
    
    // ดึงค่าปัจจุบันมาก่อนเพื่อเช็คสถานะ
    const currentCount = await redisClient.incr(redisKey);

    // ถ้ากดครั้งที่ 8 เป๊ะ ให้สั่งล็อก 3 นาที (180 วินาที)
    if (currentCount === 8) {
      await redisClient.expire(redisKey, 180);
    }

    // ถ้าเกิน 8 ไปแล้ว ให้เช็คเวลาที่เหลือ
    if (currentCount >= 8) {
      const ttl = await redisClient.ttl(redisKey);
      return res.status(429).json({
        success: false,
        message: "คุณเข้าสู่ระบบผิดพลาดบ่อยเกินไป กรุณารอสักครู่",
        timeLeft: ttl > 0 ? ttl : 180
      });
    }

    next();
  } catch (error) {
    next();
  }
};