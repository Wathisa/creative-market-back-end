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
    shippingAddress: {
      recipientName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      district: { type: String, trim: true, default: "" },
      province: { type: String, required: true },
      postcode: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: [true, "กรุณาระบุช่องทางการชำระเงิน"],
      enum: {
        values: ["promptpay", "credit_card", "true_money"],
        message: "{VALUE} ไม่ใช่ช่องทางการชำระเงินที่รองรับ",
      },
    },
    paymentRef: { type: String, default: "" }, // เลขที่อ้างอิงการโอนเงิน
    paidAt: { type: Date }, // วันที่ยืนยันการชำระเงิน
  },
  { timestamps: true },
);

export const Order = mongoose.model("Order", orderSchema);
