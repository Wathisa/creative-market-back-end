// middlewares/upload.js
import multer from "multer";

// ตั้งค่าให้บันทึกไฟล์ชั่วคราวไว้ในโฟลเดอร์ชื่อ 'uploads/'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const upload = multer({ storage });