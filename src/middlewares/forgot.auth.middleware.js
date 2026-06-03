import rateLimit from 'express-rate-limit';

// สร้าง Middleware สำหรับจำกัดการส่งคำขอรีเซ็ตรหัสผ่าน
export const forgotPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // กำหนดช่วงเวลาเป็น 10 นาที
  max: 5, // จำกัดให้ 1 IP สามารถส่งคำขอได้สูงสุดแค่ 5 ครั้งภายใน 10 นาที
  message: {
    success: false,
    message: "คุณส่งคำขอรีเซ็ตรหัสผ่านบ่อยเกินไป กรุณารอสักครู่ (ประมาณ 10 นาที) แล้วลองใหม่อีกครั้งครับ"
  },
  standardHeaders: true, // ส่งข้อมูล Rate Limit แจ้งกลับไปใน Headers (มาตรฐานใหม่)
  legacyHeaders: false, // ปิดการส่ง X-RateLimit-* headers แบบเก่า เพื่อความคลีน
});