import { User } from "./user.model.js";

export const checkEmail = async (req, res) => {
  const { email } = req.query;
  const user = await User.findOne({ email });
  if (user) {
    return res.status(200).json({ exists: true, message: "Email already in use" });
  }
  return res.status(200).json({ exists: false, message: "Email is available" });
};

export const registerUser = async (req, res) => {
  // 1. ดึง username และ role ออกมาจาก req.body ด้วย
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

  res.status(201).json({ success: true, message: "User registered successfully" });
};