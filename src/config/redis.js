import { createClient } from 'redis';
import 'dotenv/config'; 

export const redisClient = createClient({
  url: process.env.REDIS_URI,
  pingInterval: 10000, // เพิ่มบรรทัดนี้: ส่ง Ping ทุกๆ 10 วินาที เพื่อหลอก Cloud ว่าเรายังใช้งานอยู่ (Keep-alive)
  socket: {
    // กำหนดให้พยายามเชื่อมต่อใหม่ (Reconnect) อัตโนมัติถ้าสายหลุด
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
  }
});

// สำคัญมากบรรทัดนี้: ดักจับ Error ใน Background เพื่อไม่ให้ Server Node.js แครช
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
});

redisClient.on('connect', () => console.log('✅ Redis Connected Successfully'));
redisClient.on('reconnecting', () => console.log('⚠️ Redis Reconnecting...'));

redisClient.connect().catch((err) => console.error('❌ Redis Connection Error:', err));