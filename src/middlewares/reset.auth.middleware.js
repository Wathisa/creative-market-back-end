import { redisClient } from '../config/redis.js';

export const resetPasswordLimiter = async (req, res, next) => {
  try {
    const clientIp = req.ip;
    const redisKey = `rl:reset:${clientIp}`;

    const currentCount = await redisClient.incr(redisKey);

    if (currentCount === 1) {
      await redisClient.expire(redisKey, 180);
    }

    if (currentCount === 8) {
      await redisClient.expire(redisKey, 180);
    }

    if (currentCount > 7) {
      const ttlSeconds = await redisClient.ttl(redisKey);
      
      res.setHeader('Retry-After', ttlSeconds > 0 ? ttlSeconds : 180);
      res.setHeader('RateLimit-Reset', ttlSeconds > 0 ? ttlSeconds : 180);

      return res.status(429).json({
        success: false,
        message: "คุณส่งเปลี่ยนรีเซ็ตรหัสผ่านบ่อยเกินไป กรุณารอสักครู่ (ประมาณ 3 นาที) แล้วลองใหม่อีกครั้งครับ",
        timeLeft: ttlSeconds > 0 ? ttlSeconds : 180
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};