import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },      // เช่น "บ้าน", "ที่ทำงาน"
    detail: { type: String, required: true },    // ที่อยู่โดยละเอียด
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Address = mongoose.model("Address", addressSchema);
