import { User } from "./user.model.js";
// อย่าลืม import redisClient มาเพื่อใช้เคลียร์ค่า
import { redisClient } from "../../config/redis.js"; 

export const checkEmail = async (req, res) => {
  const { email } = req.query;
  const user = await User.findOne({ email });
  if (user) {
    return res.status(200).json({ exists: true, message: "Email already in use" });
  }
  return res.status(200).json({ exists: false, message: "Email is available" });
};

export const registerUser = async (req, res) => {
  const { email, password, confirmPassword, username, role } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const newUser = new User({ email, password, username, role });
  await newUser.save();

  // === ส่วนที่เพิ่ม: พอข้อมูลลง Database เรียบร้อย ให้รีเซ็ตค่ากลับเป็น 0 ทันที ===
  try {
    const clientIp = req.ip;
    const redisKey = `rl:register:${clientIp}`; 
    await redisClient.del(redisKey);
    console.log(`เคลียร์สถานะการนับให้ IP: ${clientIp} เรียบร้อยแล้ว`);
  } catch (error) {
    console.error("Failed to delete Redis key:", error);
  }
  // ===============================================================

  res.status(201).json({ success: true, message: "User registered successfully" });
};