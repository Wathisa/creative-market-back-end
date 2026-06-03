import crypto from 'crypto';
import { User } from '../register/user.model.js'; 

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'กรุณาส่ง Token และรหัสผ่านใหม่ให้ครบถ้วน' });
    }

    
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token ไม่ถูกต้อง หรือหมดอายุแล้ว' });
    }

   
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
};