import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { User } from '../register/user.model.js'; 

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  
  // 1. ย้ายการประกาศตัวแปร user ออกมาไว้ตรงนี้ เพื่อให้ catch มองเห็นด้วย
  let user; 

  try {
    // 2. เปลี่ยนจาก const user = ... เป็นแค่ user = ...
    user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้อีเมลนี้ในระบบ' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 3600000; 
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`; 

   const message = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6; border-radius: 12px;">
    <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: center;">
      
      <h2 style="color: #1e1a3d; margin-bottom: 20px; font-size: 32px;">รีเซ็ตรหัสผ่านของคุณ</h2>
      
      <p style="color: #4b5563; font-size: 22px; line-height: 1.6; margin-bottom: 30px;">
        คุณได้รับอีเมลฉบับนี้เนื่องจากมีการร้องขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ<br>
        โปรดคลิกที่ปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:
      </p>
      
      <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #7b74c4; color: #ffffff; text-decoration: none; font-size: 22px; font-weight: bold; border-radius: 50px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(123, 116, 196, 0.3);">
        คลิกเพื่อรีเซ็ตรหัสผ่าน
      </a>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20px;">
      
      <p style="color: #9ca3af; font-size: 18px; text-align: left; line-height: 1.5;">
        <strong>หมายเหตุ:</strong> ลิงก์นี้จะหมดอายุภายในระยะเวลาที่กำหนด หากคุณไม่ได้เป็นผู้ร้องขอการรีเซ็ตรหัสผ่านนี้ โปรดเพิกเฉยต่ออีเมลฉบับนี้ รหัสผ่านของคุณจะยังคงปลอดภัย<br><br>
        หากปุ่มด้านบนไม่ทำงาน คุณสามารถคัดลอกและวางลิงก์ด้านล่างนี้ในเว็บเบราว์เซอร์ของคุณ:<br>
        <a href="${resetUrl}" style="color: #7b74c4; word-break: break-all;">${resetUrl}</a>
      </p>

    </div>
  </div>
`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'คำขอรีเซ็ตรหัสผ่าน',
      html: message,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'ส่งอีเมลสำหรับรีเซ็ตรหัสผ่านเรียบร้อยแล้ว' });
  } catch (error) {
    // 3. เช็คก่อนว่ามีตัวแปร user ให้เคลียร์ข้อมูลไหม
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }
    // 4. ส่งข้อความ Error กลับไปหาหน้าบ้านให้ชัดเจน
    res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
};