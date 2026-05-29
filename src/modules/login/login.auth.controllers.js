
import { User } from '../register/user.model.js'; 

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const payload = {
      userId: user._id,
      role: user.role 
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h' 
    });

    const cookieOptions = {
      httpOnly: true, 
      maxAge: 60 * 60 * 1000, 
      secure: process.env.NODE_ENV === 'production', 
      domain: process.env.COOKIE_DOMAIN === 'localhost' ? 'localhost' : process.env.COOKIE_DOMAIN, 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' 
    };

    const cookieName = user.role === 'admin' ? 'admin_token' : 'user_token';

    res.cookie(cookieName, token, cookieOptions);

    res.status(200).json({
      message: 'เข้าสู่ระบบสำเร็จ',
      role: user.role
    });

  } catch (error) {
    console.error('Login Controller Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
};

// ตรวจสอบเซสชันของผู้ใช้
export const checkUser = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ออกจากระบบ
export const logoutUser = async (req, res, next) => {
  const isProd = process.env.NODE_ENV === "production";

  try {
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    };

    res.clearCookie("user_token", cookieOptions);
    res.clearCookie("admin_token", cookieOptions);

    return res
      .status(200)
      .json({ success: true, message: "Logout successfully!" });
  } catch (error) {
    next(error);
  }
};