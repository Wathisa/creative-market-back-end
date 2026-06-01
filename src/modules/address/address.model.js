import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    address: {
      recipientName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      street: { type: String, required: true, trim: true },
      district: { type: String, trim: true, default: "" },
      province: { type: String, required: true, trim: true },
      postcode: { type: String, required: true, trim: true },
    },
  },
  { timestamps: true },
);

export const Address = mongoose.model("Address", addressSchema);
