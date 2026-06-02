import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true }, // Snapshot ชื่อสินค้า
        price: { type: Number, required: true }, // Snapshot ราคาตอนที่ซื้อ
        quantity: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    paymentMethod: { type: String, default: "promptpay" },
    courier: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
