import mongoose from "mongoose";
import bcrypt from "bcrypt";


const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'กรุณาระบุอีเมล (Email is required)'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'กรุณาระบุรูปแบบอีเมลให้ถูกต้อง'
    ]
  },
  password: { 
    type: String, 
    required: [true, 'กรุณาระบุรหัสผ่าน (Password is required)'], 
    select: false
  },
  role: { 
    type: String, 
    required: true, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  username: { type: String },
  firstname: { type: String },
  lastname: { type: String },
  address: { type: String, default: "" }, 
  label: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  passwordChangedAt: { type: Date }
}, {
  timestamps: true 
});



// ลบตัวแปร next ออกจากวงเล็บเลยครับ
userSchema.pre("save", async function () {
  // ถ้าไม่ได้แก้ไข password ให้ข้ามไป
  if (!this.isModified("password")) return;

  // ทำการ hash โดยไม่ต้องมี next
  const hashedPassword = await bcrypt.hash(this.password, 10);
  this.password = hashedPassword;
});

export const User = mongoose.model("User", userSchema);