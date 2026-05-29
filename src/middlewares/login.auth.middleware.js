const jwt = require('jsonwebtoken');

// 1. ตรวจสอบ Token
const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.admin_token || req.cookies.user_token;

    if (!token) {
      return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน (No token provided)' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(403).json({ message: 'เซสชันหมดอายุ หรือ Token ไม่ถูกต้อง' });
  }
};

// 2. ตรวจสอบ Role
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (Forbidden)' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};